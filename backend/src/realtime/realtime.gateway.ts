import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { SendMessageDto } from '../message/dto/send-message.dto';
import { MessageService } from '../message/message.service';
import { MessageView } from '../message/message.types';
import { ProjectPermissionService } from '../project/project-permission.service';
import { UpdateTaskStatusDto } from '../task/dto/update-task-status.dto';
import { TaskService } from '../task/task.service';
import { TaskView } from '../task/task.types';
import { TaskPermissionService } from '../task/task-permission.service';
import { JoinProjectRoomDto } from './dto/join-project-room.dto';
import { JoinTaskRoomDto } from './dto/join-task-room.dto';
import { ProjectTypingDto } from './dto/project-typing.dto';
import { SocketMessageCreateDto } from './dto/socket-message-create.dto';
import { SocketTaskUpdateDto } from './dto/socket-task-update.dto';
import { SocketAck, SocketAckResponse, SocketState } from './realtime.types';
import { PresenceService } from './presence.service';
import { WsAllExceptionsFilter } from './ws-exception.filter';

type AuthenticatedSocket = Socket & {
  data: SocketState;
};

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : defaultCorsOrigins;

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Socket origin not allowed.'), false);
    },
  },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@UseFilters(new WsAllExceptionsFilter())
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly taskService: TaskService,
    private readonly projectPermissionService: ProjectPermissionService,
    private readonly taskPermissionService: TaskPermissionService,
    private readonly presenceService: PresenceService,
  ) {}

  afterInit(): void {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<{
        id: number;
      }>(token);

      client.data.user = await this.authService.findAuthenticatedUserById(
        payload.id,
      );
      client.data.joinedProjectIds = new Set<number>();
      client.data.typingProjectIds = new Set<number>();
    } catch {
      client.emit('socket:error', this.errorResponse('Unauthorized socket connection.'));
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const user = client.data.user;
    if (!user) {
      return;
    }

    for (const projectId of client.data.joinedProjectIds ?? []) {
      await this.presenceService.unregisterProjectPresence(projectId, user.id, client.id);
      await this.broadcastProjectPresence(projectId);
    }

    for (const projectId of client.data.typingProjectIds ?? []) {
      await this.presenceService.unregisterProjectTyping(projectId, user.id);
      this.server.to(this.projectRoom(projectId)).emit('project:typing', {
        projectId,
        userId: user.id,
        isTyping: false,
      });
    }
  }

  @SubscribeMessage('project:join')
  async handleProjectJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinProjectRoomDto,
    @Ack() ack: SocketAck<{ room: string; onlineUserIds: number[] }>,
  ): Promise<void> {
    ack(
      await this.withAck(async () => {
      const user = this.getUser(client);
      await this.projectPermissionService.ensureActiveMember(
        payload.projectId,
        user.id,
      );

      const room = this.projectRoom(payload.projectId);
      await client.join(room);
      client.data.joinedProjectIds?.add(payload.projectId);
      await this.presenceService.registerProjectPresence(payload.projectId, user.id, client.id);
      await this.broadcastProjectPresence(payload.projectId);

      const onlineUserIds = await this.presenceService.getProjectOnlineUserIds(payload.projectId);
      return {
        room,
        onlineUserIds,
      };
      }),
    );
  }

  @SubscribeMessage('project:presence:get')
  async handleProjectPresenceGet(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinProjectRoomDto,
    @Ack() ack: SocketAck<{ projectId: number; onlineUserIds: number[] }>,
  ): Promise<void> {
    ack(
      await this.withAck(async () => {
        const user = this.getUser(client);
        await this.projectPermissionService.ensureActiveMember(
          payload.projectId,
          user.id,
        );

        const onlineUserIds = await this.presenceService.getProjectOnlineUserIds(payload.projectId);
        return {
          projectId: payload.projectId,
          onlineUserIds,
        };
      }),
    );
  }

  @SubscribeMessage('task:join')
  async handleTaskJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinTaskRoomDto,
    @Ack() ack: SocketAck<{ room: string }>,
  ): Promise<void> {
    ack(
      await this.withAck(async () => {
      const user = this.getUser(client);
      await this.taskPermissionService.ensureCanViewTask(payload.taskId, user.id);

      const room = this.taskRoom(payload.taskId);
      await client.join(room);

      return { room };
      }),
    );
  }

  @SubscribeMessage('message:create')
  async handleMessageCreate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SocketMessageCreateDto,
    @Ack() ack: SocketAck<MessageView>,
  ): Promise<void> {
    ack(
      await this.withAck(async () => {
      const user = this.getUser(client);
      const dto: SendMessageDto = {
        content: payload.content,
        metadata: payload.metadata,
        isAnnouncement: payload.isAnnouncement,
      };

      if (payload.projectId && payload.taskId) {
        throw new BadRequestException(
          'Send either a project message or a task message, not both.',
        );
      }

      if (!payload.projectId && !payload.taskId) {
        throw new BadRequestException(
          'A projectId or taskId is required to create a message.',
        );
      }

      if (payload.taskId) {
        const message = await this.messageService.sendTaskMessage(
          payload.taskId,
          user,
          dto,
        );

        const broadcastPayload = this.formatBroadcastPayload(message);
        const room = this.taskRoom(payload.taskId);
        setImmediate(() => {
          this.server.to(room).emit('message:created', broadcastPayload);
        });

        return message;
      }

      const message = await this.messageService.sendProjectMessage(
        payload.projectId!,
        user,
        dto,
      );

      await this.presenceService.unregisterProjectTyping(payload.projectId!, user.id);
      client.data.typingProjectIds?.delete(payload.projectId!);
      this.server.to(this.projectRoom(payload.projectId!)).emit('project:typing', {
        projectId: payload.projectId!,
        userId: user.id,
        isTyping: false,
      });

      const broadcastPayload = this.formatBroadcastPayload(message);
      const room = this.projectRoom(payload.projectId!);
      setImmediate(() => {
        this.server.to(room).emit('message:created', broadcastPayload);
      });

      return message;
      }),
    );
  }

  @SubscribeMessage('project:typing')
  async handleProjectTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ProjectTypingDto,
    @Ack()
    ack: SocketAck<{ projectId: number; userId: number; isTyping: boolean }>,
  ): Promise<void> {
    ack(
      await this.withAck(async () => {
        const user = this.getUser(client);
        await this.projectPermissionService.ensureActiveMember(
          payload.projectId,
          user.id,
        );

        if (payload.isTyping) {
          await this.presenceService.registerProjectTyping(payload.projectId, user.id);
          client.data.typingProjectIds?.add(payload.projectId);
        } else {
          await this.presenceService.unregisterProjectTyping(payload.projectId, user.id);
          client.data.typingProjectIds?.delete(payload.projectId);
        }

        this.server.to(this.projectRoom(payload.projectId)).emit('project:typing', {
          projectId: payload.projectId,
          userId: user.id,
          isTyping: payload.isTyping,
        });

        return {
          projectId: payload.projectId,
          userId: user.id,
          isTyping: payload.isTyping,
        };
      }),
    );
  }

  @SubscribeMessage('task:update')
  async handleTaskUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SocketTaskUpdateDto,
    @Ack() ack: SocketAck<TaskView>,
  ): Promise<void> {
    ack(
      await this.withAck(async () => {
      const user = this.getUser(client);
      const task = await this.taskService.updateStatus(payload.taskId, user, {
        status: payload.status,
      } as UpdateTaskStatusDto);

      this.server.to(this.taskRoom(payload.taskId)).emit('task:updated', task);
      this.server.to(this.projectRoom(task.projectId)).emit('task:updated', task);

      return task;
      }),
    );
  }

  private async withAck<T>(
    handler: () => Promise<T>,
  ): Promise<SocketAckResponse<T>> {
    try {
      const data = await handler();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.errorResponse(this.getErrorMessage(error));
    }
  }

  private getUser(client: AuthenticatedSocket) {
    if (!client.data.user) {
      throw new UnauthorizedException('Socket user is not authenticated.');
    }

    return client.data.user;
  }

  private extractToken(client: AuthenticatedSocket): string {
    const authToken = client.handshake.auth?.token;
    const headerToken = client.handshake.headers.authorization;
    const rawToken =
      typeof authToken === 'string' && authToken.length > 0
        ? authToken
        : headerToken;

    if (!rawToken || typeof rawToken !== 'string') {
      throw new UnauthorizedException('Missing socket token.');
    }

    return rawToken.startsWith('Bearer ')
      ? rawToken.slice('Bearer '.length)
      : rawToken;
  }

  private projectRoom(projectId: number): string {
    return `project:${projectId}`;
  }

  private taskRoom(taskId: number): string {
    return `task:${taskId}`;
  }

  private async broadcastProjectPresence(projectId: number): Promise<void> {
    const onlineUserIds = await this.presenceService.getProjectOnlineUserIds(projectId);
    this.server.to(this.projectRoom(projectId)).emit('project:presence', {
      projectId,
      onlineUserIds,
    });
  }

  private formatBroadcastPayload(message: MessageView) {
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      projectId: message.projectId,
      taskId: message.taskId,
      isSystem: message.isSystem,
      isImportant: message.isImportant,
      isAnnouncement: message.isAnnouncement,
      metadata: message.metadata,
      createdAt: message.createdAt instanceof Date 
        ? message.createdAt.toISOString() 
        : message.createdAt,
      sender: message.sender
        ? {
            id: message.sender.id,
            email: message.sender.email,
            name: message.sender.name,
            role: message.sender.role,
          }
        : null,
    };
  }

  // Typing state tracking has been migrated cleanly to Redis Sorted Sets in PresenceService.

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unexpected socket error.';
  }

  private errorResponse(message: string): SocketAckResponse<never> {
    return {
      success: false,
      error: {
        message,
      },
    };
  }
}
