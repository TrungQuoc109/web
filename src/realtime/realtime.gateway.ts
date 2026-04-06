import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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
import { SocketMessageCreateDto } from './dto/socket-message-create.dto';
import { SocketTaskUpdateDto } from './dto/socket-task-update.dto';
import { SocketAck, SocketAckResponse, SocketState } from './realtime.types';

type AuthenticatedSocket = Socket & {
  data: SocketState;
};

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
  },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
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
    } catch {
      client.emit('socket:error', this.errorResponse('Unauthorized socket connection.'));
      client.disconnect();
    }
  }

  @SubscribeMessage('project:join')
  async handleProjectJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinProjectRoomDto,
    @Ack() ack: SocketAck<{ room: string }>,
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

      return { room };
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

        this.server.to(this.taskRoom(payload.taskId)).emit('message:created', message);
        return message;
      }

      const message = await this.messageService.sendProjectMessage(
        payload.projectId!,
        user,
        dto,
      );

      this.server
        .to(this.projectRoom(payload.projectId!))
        .emit('message:created', message);

      return message;
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
