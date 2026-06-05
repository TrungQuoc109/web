import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationType, Prisma, ProjectRole, ReportStatus } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
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
import {
  MessageEventNames,
  ProjectOwnershipTransferredEvent,
  ProjectMemberReactivatedEvent,
  ProjectMemberAddedEvent,
  ProjectMemberRoleChangedEvent,
  ProjectMemberRemovedEvent,
  InvitationAcceptedEvent,
  TaskCreatedEvent,
  TaskAssignedEvent,
  TaskStatusChangedEvent,
  TaskPriorityChangedEvent,
  TaskReportSubmittedEvent,
  TaskReportReviewedEvent,
} from './events/message.events';

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



  async listProjectMessages(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<MessageView[]> {
    await this.projectPermissionService.ensureActiveMember(projectId, currentUser.id);

    return this.prisma.message.findMany({
      where: {
        projectId,
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

  @OnEvent(MessageEventNames.PROJECT_OWNERSHIP_TRANSFERRED)
  async handleProjectOwnershipTransferred(event: ProjectOwnershipTransferredEvent) {
    await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.previousOwnerEmail} transferred project ownership to ${event.newOwnerEmail}.`,
      metadata: {
        type: 'OWNERSHIP_TRANSFERRED',
        previousOwnerId: event.previousOwnerId,
        newOwnerId: event.newOwnerId,
      },
    });
  }

  @OnEvent(MessageEventNames.PROJECT_MEMBER_REACTIVATED)
  async handleProjectMemberReactivated(event: ProjectMemberReactivatedEvent) {
    await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} reactivated ${event.targetUserEmail} as a project member.`,
      metadata: {
        type: 'MEMBER_ADDED',
        memberUserId: event.memberUserId,
        role: event.role,
        addedById: event.addedById,
      },
    });
  }

  @OnEvent(MessageEventNames.PROJECT_MEMBER_ADDED)
  async handleProjectMemberAdded(event: ProjectMemberAddedEvent) {
    await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} added ${event.targetUserEmail} to the project.`,
      metadata: {
        type: 'MEMBER_ADDED',
        memberUserId: event.memberUserId,
        role: event.role,
        addedById: event.addedById,
      },
    });
  }

  @OnEvent(MessageEventNames.PROJECT_MEMBER_ROLE_CHANGED)
  async handleProjectMemberRoleChanged(event: ProjectMemberRoleChangedEvent) {
    await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} changed the role of ${event.targetUserEmail} from ${event.previousRole} to ${event.nextRole}.`,
      metadata: {
        type: 'MEMBER_ROLE_CHANGED',
        memberUserId: event.memberUserId,
        previousRole: event.previousRole,
        nextRole: event.nextRole,
        changedById: event.changedById,
      },
    });
  }

  @OnEvent(MessageEventNames.PROJECT_MEMBER_REMOVED)
  async handleProjectMemberRemoved(event: ProjectMemberRemovedEvent) {
    await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} removed ${event.targetUserEmail} from the project.`,
      metadata: {
        type: 'MEMBER_REMOVED',
        memberUserId: event.memberUserId,
        previousRole: event.previousRole,
        removedById: event.removedById,
      },
    });
  }

  @OnEvent(MessageEventNames.INVITATION_ACCEPTED)
  async handleInvitationAccepted(event: InvitationAcceptedEvent) {
    const activity = await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} joined the project via invitation.`,
      metadata: {
        type: 'INVITATION_ACCEPTED',
        invitationId: event.invitationId,
        userId: event.userId,
      },
    });

    const recipientIds = await this.getActiveProjectRecipientIds(event.projectId, [
      event.userId,
    ]);

    if (recipientIds.length > 0) {
      await this.notificationService.createNotifications({
        activityId: activity.id,
        type: NotificationType.ANNOUNCEMENT,
        recipientIds,
      });
    }
  }

  @OnEvent(MessageEventNames.TASK_CREATED)
  async handleTaskCreated(event: TaskCreatedEvent) {
    await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} created task ${event.title}.`,
      metadata: {
        type: 'TASK_CREATED',
        taskId: event.taskId,
        createdById: event.createdById,
        priority: event.priority,
      },
    });
  }

  @OnEvent(MessageEventNames.TASK_ASSIGNED)
  async handleTaskAssigned(event: TaskAssignedEvent) {
    const activity = await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} assigned users to the task.`,
      metadata: {
        type: 'TASK_ASSIGNED',
        taskId: event.taskId,
        assignedUserIds: event.assignedUserIds,
        assignedById: event.assignedById,
      },
    });

    await this.notificationService.createNotifications({
      activityId: activity.id,
      type: NotificationType.ASSIGNED,
      recipientIds: event.assignedUserIds,
    });
  }

  @OnEvent(MessageEventNames.TASK_STATUS_CHANGED)
  async handleTaskStatusChanged(event: TaskStatusChangedEvent) {
    const activity = await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} changed task status to ${event.status}.`,
      metadata: {
        type: 'TASK_STATUS_CHANGED',
        taskId: event.taskId,
        status: event.status,
        changedById: event.changedById,
      },
    });

    const assignments = await this.prisma.taskAssignment.findMany({
      where: {
        taskId: event.taskId,
      },
      select: {
        userId: true,
      },
    });

    const recipients = assignments
      .map((assignment) => assignment.userId)
      .filter((userId) => userId !== event.changedById);

    if (recipients.length > 0) {
      await this.notificationService.createNotifications({
        activityId: activity.id,
        type: NotificationType.STATUS_CHANGED,
        recipientIds: recipients,
      });
    }
  }

  @OnEvent(MessageEventNames.TASK_PRIORITY_CHANGED)
  async handleTaskPriorityChanged(event: TaskPriorityChangedEvent) {
    const activity = await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} changed task priority to ${event.priority}.`,
      metadata: {
        type: 'TASK_PRIORITY_CHANGED',
        taskId: event.taskId,
        previousPriority: event.previousPriority,
        priority: event.priority,
        changedById: event.changedById,
      },
    });

    const assignments = await this.prisma.taskAssignment.findMany({
      where: {
        taskId: event.taskId,
      },
      select: {
        userId: true,
      },
    });

    const recipients = assignments
      .map((assignment) => assignment.userId)
      .filter((userId) => userId !== event.changedById);

    if (recipients.length > 0) {
      await this.notificationService.createNotifications({
        activityId: activity.id,
        type: NotificationType.PRIORITY_CHANGED,
        recipientIds: recipients,
      });
    }
  }

  @OnEvent(MessageEventNames.TASK_REPORT_SUBMITTED)
  async handleTaskReportSubmitted(event: TaskReportSubmittedEvent) {
    const activity = await this.createSystemMessage({
      projectId: event.projectId,
      content: `${event.currentUserEmail} submitted a task report.`,
      metadata: {
        type: 'TASK_REPORT_SUBMITTED',
        taskId: event.taskId,
        reportId: event.reportId,
        authorId: event.authorId,
      },
    });

    const assignments = await this.prisma.taskAssignment.findMany({
      where: {
        taskId: event.taskId,
        userId: {
          not: event.authorId,
        },
      },
      select: {
        userId: true,
      },
    });

    const recipientIds = assignments.map((a) => a.userId);

    if (recipientIds.length > 0) {
      await this.notificationService.createNotifications({
        activityId: activity.id,
        type: NotificationType.ANNOUNCEMENT,
        recipientIds,
      });
    }
  }

  @OnEvent(MessageEventNames.TASK_REPORT_REVIEWED)
  async handleTaskReportReviewed(event: TaskReportReviewedEvent) {
    const report = await this.prisma.taskReport.findUnique({
      where: { id: event.reportId },
      select: { authorId: true },
    });

    if (!report) {
      return;
    }

    const isApproved = event.status === ReportStatus.APPROVED;
    const content = isApproved
      ? (event.allApproved
          ? `${event.currentUserEmail} approved a task report and completed the task.`
          : `${event.currentUserEmail} approved a task report.`)
      : `${event.currentUserEmail} rejected a task report.`;

    const activity = await this.createSystemMessage({
      projectId: event.projectId,
      content,
      metadata: {
        type: isApproved ? 'TASK_REPORT_APPROVED' : 'TASK_REPORT_REJECTED',
        taskId: event.taskId,
        reportId: event.reportId,
      },
    });

    const reviewer = await this.prisma.user.findUnique({
      where: { email: event.currentUserEmail },
      select: { id: true },
    });

    if (reviewer) {
      await this.prisma.message.update({
        where: { id: activity.id },
        data: {
          metadata: this.toJsonValue({
            type: isApproved ? 'TASK_REPORT_APPROVED' : 'TASK_REPORT_REJECTED',
            taskId: event.taskId,
            reportId: event.reportId,
            reviewerId: reviewer.id,
          }),
        },
      });
    }

    if (reviewer && report.authorId !== reviewer.id) {
      await this.notificationService.createNotifications({
        activityId: activity.id,
        type: NotificationType.ANNOUNCEMENT,
        recipientIds: [report.authorId],
      });
    }
  }
}
