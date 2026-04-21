import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationType, Prisma, ProjectRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionService } from '../project/project-permission.service';
import { TaskPermissionService } from '../task/task-permission.service';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { messageSelect } from './message.constants';
import {
  CreateSystemMessageInput,
  MessageCatalogView,
  MessageView,
} from './message.types';

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

    const activeMembers = await this.getActiveProjectMembers(projectId);
    const mentionedMemberIds = this.extractMentionedMemberIds(
      dto.content,
      activeMembers,
      currentUser.id,
    );
    const metadata = this.buildMessageMetadata(dto.metadata, mentionedMemberIds);

    const message = await this.prisma.message.create({
      data: {
        content: dto.content.trim(),
        senderId: currentUser.id,
        projectId,
        taskId: null,
        metadata: this.toJsonValue(metadata),
        isSystem: false,
        isAnnouncement: dto.isAnnouncement ?? false,
      },
      select: messageSelect,
    });

    if (mentionedMemberIds.length > 0) {
      await this.notificationService.createNotifications({
        activityId: message.id,
        type: NotificationType.MENTION,
        recipientIds: mentionedMemberIds,
      });
    }

    if (message.isAnnouncement) {
      const recipientIds = activeMembers
        .map((member) => member.userId)
        .filter(
          (userId) =>
            userId !== currentUser.id && !mentionedMemberIds.includes(userId),
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

    const activeMembers = await this.getActiveProjectMembers(task.projectId);
    const mentionedMemberIds = this.extractMentionedMemberIds(
      dto.content,
      activeMembers,
      currentUser.id,
    );
    const metadata = this.buildMessageMetadata(dto.metadata, mentionedMemberIds);

    const message = await this.prisma.message.create({
      data: {
        content: dto.content.trim(),
        senderId: currentUser.id,
        projectId: task.projectId,
        taskId,
        metadata: this.toJsonValue(metadata),
        isSystem: false,
        isAnnouncement: false,
      },
      select: messageSelect,
    });

    if (mentionedMemberIds.length > 0) {
      await this.notificationService.createNotifications({
        activityId: message.id,
        type: NotificationType.MENTION,
        recipientIds: mentionedMemberIds,
      });
    }

    return message;
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

  async listProjectMessagesCatalog(
    projectId: number,
    currentUser: AuthenticatedUser,
    query: ListMessagesQueryDto,
  ): Promise<MessageCatalogView> {
    await this.projectPermissionService.ensureActiveMember(projectId, currentUser.id);

    const normalizedSearch = query.search?.trim();
    const where = {
      projectId,
      taskId: null,
      ...(normalizedSearch
        ? {
            content: {
              contains: normalizedSearch,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };
    const total = await this.prisma.message.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const items = await this.prisma.message.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * query.pageSize,
      take: query.pageSize,
      select: messageSelect,
    });

    return {
      items: items.reverse(),
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    };
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

  async listTaskMessagesCatalog(
    taskId: number,
    currentUser: AuthenticatedUser,
    query: ListMessagesQueryDto,
  ): Promise<MessageCatalogView> {
    const task = await this.taskPermissionService.ensureCanViewTask(
      taskId,
      currentUser.id,
    );

    const normalizedSearch = query.search?.trim();
    const where = {
      projectId: task.projectId,
      taskId,
      ...(normalizedSearch
        ? {
            content: {
              contains: normalizedSearch,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };
    const total = await this.prisma.message.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const items = await this.prisma.message.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * query.pageSize,
      take: query.pageSize,
      select: messageSelect,
    });

    return {
      items: items.reverse(),
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    };
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

  private async getActiveProjectMembers(projectId: number): Promise<
    {
      userId: number;
      email: string;
      name: string | null;
    }[]
  > {
    return this.prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null,
      },
      select: {
        userId: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    }).then((members) =>
      members.map((member) => ({
        userId: member.userId,
        email: member.user.email,
        name: member.user.name,
      })),
    );
  }

  private extractMentionedMemberIds(
    content: string,
    members: { userId: number; email: string; name: string | null }[],
    senderId: number,
  ): number[] {
    const mentionMatches = Array.from(
      content.matchAll(/@([a-zA-Z0-9._-]+)/g),
      (match) => this.normalizeMentionToken(match[1]),
    );

    if (mentionMatches.length === 0) {
      return [];
    }

    const matchedUserIds = new Set<number>();

    for (const member of members) {
      if (member.userId === senderId) {
        continue;
      }

      const candidateTokens = this.getMentionCandidateTokens(member);
      if (candidateTokens.some((token) => mentionMatches.includes(token))) {
        matchedUserIds.add(member.userId);
      }
    }

    return [...matchedUserIds];
  }

  private getMentionCandidateTokens(member: {
    email: string;
    name: string | null;
  }): string[] {
    const email = member.email.toLowerCase();
    const emailLocalPart = email.split('@')[0] ?? email;
    const tokens = new Set<string>([
      this.normalizeMentionToken(email),
      this.normalizeMentionToken(emailLocalPart),
    ]);

    if (member.name) {
      const normalizedName = member.name.trim().toLowerCase();
      const nameParts = normalizedName.split(/\s+/).filter(Boolean);

      tokens.add(this.normalizeMentionToken(normalizedName));
      tokens.add(this.normalizeMentionToken(normalizedName.replace(/\s+/g, '')));
      tokens.add(this.normalizeMentionToken(normalizedName.replace(/\s+/g, '.')));
      tokens.add(this.normalizeMentionToken(normalizedName.replace(/\s+/g, '-')));

      for (const part of nameParts) {
        tokens.add(this.normalizeMentionToken(part));
      }
    }

    return [...tokens];
  }

  private buildMessageMetadata(
    metadata: Record<string, unknown> | Prisma.InputJsonValue | undefined,
    mentionedUserIds: number[],
  ): Record<string, unknown> | Prisma.InputJsonValue | undefined {
    if (mentionedUserIds.length === 0) {
      return metadata;
    }

    const baseMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : {};

    return {
      ...baseMetadata,
      mentionedUserIds,
    };
  }

  private normalizeMentionToken(value: string): string {
    return value.trim().toLowerCase();
  }
}
