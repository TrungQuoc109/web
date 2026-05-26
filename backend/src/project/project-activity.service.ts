import { Injectable } from '@nestjs/common';
import { InvitationStatus, Prisma, ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionService } from './project-permission.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { ProjectActivityView } from './project.types';

@Injectable()
export class ProjectActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
  ) {}

  /**
   * Lấy timeline hoạt động đầy đủ của dự án (messages, task reports, invitations)
   */
  async getProjectActivity(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectActivityView[]> {
    await this.permission.ensureActiveMember(projectId, currentUser.id);

    const [messages, taskReports, invitations] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        select: {
          id: true,
          content: true,
          createdAt: true,
          taskId: true,
          isSystem: true,
          isAnnouncement: true,
          metadata: true,
          task: {
            select: {
              title: true,
            },
          },
          sender: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.taskReport.findMany({
        where: {
          task: {
            projectId,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        select: {
          id: true,
          content: true,
          createdAt: true,
          status: true,
          task: {
            select: {
              title: true,
            },
          },
          author: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.invitation.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        select: {
          id: true,
          email: true,
          status: true,
          role: true,
          createdAt: true,
          sender: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const messageActivities = messages.map((message) =>
      this.buildProjectActivityFromMessage(message),
    );

    const reportActivities = taskReports.map((report) =>
      this.buildProjectActivityFromReport(report),
    );

    const invitationActivities = invitations.map((invitation) =>
      this.buildProjectActivityFromInvitation(invitation),
    );

    return [...messageActivities, ...reportActivities, ...invitationActivities]
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
      .slice(0, 20);
  }

  /**
   * Tạo danh sách hoạt động gần đây từ danh sách tin nhắn (Dành cho Project Detail)
   */
  buildRecentActivity(
    messages: {
      id: number;
      content: string;
      createdAt: Date;
      isSystem: boolean;
      isAnnouncement: boolean;
      metadata: Prisma.JsonValue | null;
      task: {
        title: string;
      } | null;
      sender: {
        id: number;
        email: string;
        name: string | null;
      } | null;
    }[],
  ): ProjectActivityView[] {
    return messages
      .slice(0, 5)
      .map((message) => this.buildProjectActivityFromMessage(message));
  }

  private buildProjectActivityFromMessage(message: {
    id: number;
    content: string;
    createdAt: Date;
    taskId?: number | null;
    isSystem: boolean;
    isAnnouncement: boolean;
    metadata: Prisma.JsonValue | null;
    task: {
      title: string;
    } | null;
    sender: {
      email: string;
      name: string | null;
    } | null;
  }): ProjectActivityView {
    const actorName = this.resolveActorName(message.sender);
    const metadata = this.toMetadataRecord(message.metadata);
    const metadataType =
      typeof metadata?.type === 'string' ? metadata.type : null;
    const taskTitle = message.task?.title ?? 'this task';

    switch (metadataType) {
      case 'TASK_CREATED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Task created',
          description: `${actorName ?? 'A teammate'} created ${taskTitle}.`,
          category: 'TASK',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'TASK_ASSIGNED': {
        const assignedCount = Array.isArray(metadata?.assignedUserIds)
          ? metadata.assignedUserIds.length
          : null;
        const assigneeLabel =
          assignedCount && assignedCount > 1
            ? `${assignedCount} teammates`
            : 'a teammate';

        return {
          id: `activity-message-${message.id}`,
          title: 'Task assignment updated',
          description: `${actorName ?? 'A teammate'} assigned ${assigneeLabel} to ${taskTitle}.`,
          category: 'TASK',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      }
      case 'TASK_STATUS_CHANGED': {
        const nextStatus =
          typeof metadata?.status === 'string'
            ? this.humanizeTaskStatus(metadata.status)
            : 'a new status';

        return {
          id: `activity-message-${message.id}`,
          title: `Task moved to ${nextStatus}`,
          description: `${actorName ?? 'A teammate'} moved ${taskTitle} to ${nextStatus}.`,
          category: 'TASK',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      }
      case 'TASK_REPORT_SUBMITTED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Task report submitted',
          description: `${actorName ?? 'A teammate'} submitted a delivery report for ${taskTitle}.`,
          category: 'REPORT',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'TASK_REPORT_APPROVED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Task report approved',
          description: `${actorName ?? 'A reviewer'} approved the latest report for ${taskTitle}.`,
          category: 'REPORT',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'TASK_REPORT_REJECTED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Task report rejected',
          description: `${actorName ?? 'A reviewer'} requested changes on the latest report for ${taskTitle}.`,
          category: 'REPORT',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'INVITATION_ACCEPTED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Invitation accepted',
          description: `${actorName ?? 'A teammate'} joined the project.`,
          category: 'MEMBER',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'PROJECT_MEMBER_ADDED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Project member added',
          description: message.content,
          category: 'MEMBER',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'PROJECT_MEMBER_ROLE_CHANGED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Member role updated',
          description: message.content,
          category: 'MEMBER',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'PROJECT_MEMBER_REMOVED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Project member removed',
          description: message.content,
          category: 'MEMBER',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      case 'PROJECT_OWNERSHIP_TRANSFERRED':
        return {
          id: `activity-message-${message.id}`,
          title: 'Project ownership transferred',
          description: message.content,
          category: 'PROJECT',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      default: {
        const title = message.taskId
          ? `Task discussion in ${taskTitle}`
          : message.isAnnouncement
            ? 'Project announcement'
            : message.isSystem
              ? 'Project system update'
              : 'Project message';

        return {
          id: `activity-message-${message.id}`,
          title,
          description: message.content,
          category: message.taskId ? 'TASK' : 'MESSAGE',
          actorName,
          metadata,
          timestamp: message.createdAt,
        };
      }
    }
  }

  private buildProjectActivityFromReport(report: {
    id: number;
    content: string;
    createdAt: Date;
    status: string;
    task: {
      title: string;
    };
    author: {
      email: string;
      name: string | null;
    };
  }): ProjectActivityView {
    const actorName = this.resolveActorName(report.author);
    const normalizedStatus =
      report.status === 'PENDING'
        ? 'pending review'
        : report.status.toLowerCase();

    return {
      id: `activity-report-${report.id}`,
      title: `Task report ${normalizedStatus}`,
      description: `${actorName ?? 'A teammate'} shared delivery evidence for ${report.task.title}.`,
      category: 'REPORT',
      actorName,
      metadata: {
        reportId: report.id,
        taskTitle: report.task.title,
        status: report.status,
      },
      timestamp: report.createdAt,
    };
  }

  private buildProjectActivityFromInvitation(invitation: {
    id: number;
    email: string;
    status: InvitationStatus;
    role: ProjectRole;
    createdAt: Date;
    sender: {
      email: string;
      name: string | null;
    };
  }): ProjectActivityView {
    const actorName = this.resolveActorName(invitation.sender);
    const statusLabel =
      invitation.status === InvitationStatus.CANCELED
        ? 'canceled'
        : invitation.status.toLowerCase();

    return {
      id: `activity-invitation-${invitation.id}`,
      title: `Invitation ${statusLabel}`,
      description: `${actorName ?? 'A teammate'} invited ${invitation.email} as ${invitation.role}.`,
      category: 'INVITATION',
      actorName,
      metadata: {
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
      },
      timestamp: invitation.createdAt,
    };
  }

  private toMetadataRecord(metadata: Prisma.JsonValue | null) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    return metadata as Record<string, unknown>;
  }

  private resolveActorName(actor: { email: string; name: string | null } | null) {
    return actor?.name ?? actor?.email ?? null;
  }

  private humanizeTaskStatus(status: string) {
    switch (status) {
      case 'TODO':
        return 'To do';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'IN_REVIEW':
        return 'In review';
      case 'DONE':
        return 'Done';
      case 'BLOCKED':
        return 'Blocked';
      default:
        return status;
    }
  }
}
