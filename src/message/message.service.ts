import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationType, Prisma, ProjectRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionService } from '../project/project-permission.service';
import { TaskPermissionService } from '../task/task-permission.service';
import { SendMessageDto } from './dto/send-message.dto';
import { messageSelect } from './message.constants';
import { CreateSystemMessageInput, MessageView } from './message.types';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly projectPermissionService: ProjectPermissionService,
    private readonly taskPermissionService: TaskPermissionService,
  ) {}

  async sendProjectMessage(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    const membership = await this.projectPermissionService.ensureActiveMember(
      projectId,
      currentUser.id,
    );

    if (membership.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot send project messages.');
    }

    if (dto.isAnnouncement) {
      await this.projectPermissionService.ensureCanManageMembers(
        projectId,
        currentUser.id,
      );
    }

    const message = await this.prisma.message.create({
      data: {
        content: dto.content.trim(),
        senderId: currentUser.id,
        projectId,
        taskId: null,
        metadata: this.toJsonValue(dto.metadata),
        isSystem: false,
        isAnnouncement: dto.isAnnouncement ?? false,
      },
      select: messageSelect,
    });

    if (message.isAnnouncement) {
      const recipientIds = await this.getActiveProjectRecipientIds(
        projectId,
        [currentUser.id],
      );

      await this.notificationService.createNotifications({
        activityId: message.id,
        type: NotificationType.ANNOUNCEMENT,
        recipientIds,
      });
    }

    return message;
  }

  async sendTaskMessage(
    taskId: number,
    currentUser: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    const task = await this.taskPermissionService.ensureCanViewTask(
      taskId,
      currentUser.id,
    );
    const membership = await this.projectPermissionService.ensureActiveMember(
      task.projectId,
      currentUser.id,
    );

    if (membership.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot send task messages.');
    }

    return this.prisma.message.create({
      data: {
        content: dto.content.trim(),
        senderId: currentUser.id,
        projectId: task.projectId,
        taskId,
        metadata: this.toJsonValue(dto.metadata),
        isSystem: false,
        isAnnouncement: false,
      },
      select: messageSelect,
    });
  }

  async listProjectMessages(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<MessageView[]> {
    await this.projectPermissionService.ensureActiveMember(projectId, currentUser.id);

    return this.prisma.message.findMany({
      where: {
        projectId,
        taskId: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: messageSelect,
    });
  }

  async listTaskMessages(
    taskId: number,
    currentUser: AuthenticatedUser,
  ): Promise<MessageView[]> {
    const task = await this.taskPermissionService.ensureCanViewTask(
      taskId,
      currentUser.id,
    );

    return this.prisma.message.findMany({
      where: {
        projectId: task.projectId,
        taskId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: messageSelect,
    });
  }

  async createSystemMessage(
    input: CreateSystemMessageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageView> {
    const client = tx ?? this.prisma;

    return client.message.create({
      data: {
        content: input.content,
        projectId: input.projectId,
        taskId: input.taskId ?? null,
        senderId: null,
        isSystem: true,
        isImportant: input.isImportant ?? false,
        isAnnouncement: input.isAnnouncement ?? false,
        metadata: this.toJsonValue(input.metadata),
      },
      select: messageSelect,
    });
  }

  private toJsonValue(
    value: Record<string, unknown> | Prisma.InputJsonValue | undefined,
  ): Prisma.InputJsonValue | undefined {
    return value as Prisma.InputJsonValue | undefined;
  }

  private async getActiveProjectRecipientIds(
    projectId: number,
    excludedUserIds: number[] = [],
  ): Promise<number[]> {
    const members = await this.prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null,
        userId: {
          notIn: excludedUserIds,
        },
      },
      select: {
        userId: true,
      },
    });

    return members.map((member) => member.userId);
  }
}
