import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  Prisma,
  ProjectRole,
  TaskStatus,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectCatalogQueryDto } from './dto/list-project-catalog-query.dto';
import { ListProjectMembersQueryDto } from './dto/list-project-members-query.dto';
import { TransferProjectOwnershipDto } from './dto/transfer-project-ownership.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { projectMemberSelect } from './project.constants';
import {
  ProjectActivityView,
  ProjectCatalogItemView,
  ProjectCatalogView,
  ProjectDetailView,
  ProjectListItemView,
  ProjectMemberView,
  ProjectStatusView,
  ProjectView,
} from './project.types';
import { ProjectPermissionService } from './project-permission.service';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  MessageEventNames,
  ProjectOwnershipTransferredEvent,
  ProjectMemberReactivatedEvent,
  ProjectMemberAddedEvent,
  ProjectMemberRoleChangedEvent,
  ProjectMemberRemovedEvent,
} from '../message/events/message.events';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createProject(
    currentUser: AuthenticatedUser,
    dto: CreateProjectDto,
  ): Promise<ProjectView> {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: currentUser.id,
          role: 'OWNER',
        },
      });

      return project;
    });
  }

  async listProjects(
    currentUser: AuthenticatedUser,
  ): Promise<ProjectListItemView[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: currentUser.id,
            leftAt: null,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: {
              where: {
                leftAt: null,
              },
            },
          },
        },
      },
    });

    const projectIds = projects.map((p) => p.id);
    const statsMap = await this.getProjectsTaskStats(projectIds);

    return projects.map((project) => {
      const stats = statsMap.get(project.id) || { total: 0, completed: 0, blocked: 0 };
      return this.mapProjectListItem(project, stats);
    });
  }

  async listProjectCatalog(
    currentUser: AuthenticatedUser,
    query: ListProjectCatalogQueryDto,
  ): Promise<ProjectCatalogView> {
    // 1. Dịch chuyển các trạng thái ảo (PLANNING, COMPLETED, AT_RISK, ACTIVE) sang database-level queries
    let statusFilter: Prisma.ProjectWhereInput = {};
    if (query.status) {
      if (query.status === 'PLANNING') {
        // Dự án đang lập kế hoạch: không có task nào
        statusFilter = { tasks: { none: {} } };
      } else if (query.status === 'COMPLETED') {
        // Dự án đã hoàn thành: có ít nhất 1 task và toàn bộ task có trạng thái DONE
        statusFilter = {
          tasks: {
            some: {},
            every: { status: 'DONE' },
          },
        };
      } else if (query.status === 'AT_RISK') {
        // Dự án gặp rủi ro: có ít nhất 1 task bị BLOCKED
        statusFilter = {
          tasks: {
            some: { status: 'BLOCKED' },
          },
        };
      } else if (query.status === 'ACTIVE') {
        // Dự án đang hoạt động: có task chưa hoàn thành và không có tệp nào bị BLOCKED
        statusFilter = {
          tasks: {
            some: { status: { not: 'DONE' } },
            none: { status: 'BLOCKED' },
          },
        };
      }
    }

    const where: Prisma.ProjectWhereInput = {
      members: {
        some: {
          userId: currentUser.id,
          leftAt: null,
        },
      },
      ...(query.search?.trim()
        ? {
            OR: [
              {
                name: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...statusFilter,
    };

    // 2. Chạy đồng thời truy vấn lấy dữ liệu phân trang và đếm tổng số bản ghi bằng $transaction
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: {
                where: {
                  leftAt: null,
                },
              },
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const projectIds = projects.map((p) => p.id);
    const statsMap = await this.getProjectsTaskStats(projectIds);

    // 3. Ánh xạ các item tương ứng mà không cần thực hiện filter/slice ở bộ nhớ RAM nữa
    const catalogItems = projects.map((project) => {
      const stats = statsMap.get(project.id) || { total: 0, completed: 0, blocked: 0 };
      return this.mapProjectCatalogItem(project, stats);
    });

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);

    return {
      items: catalogItems,
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    };
  }

  async getProjectDetail(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectDetailView> {
    await this.permission.ensureActiveMember(projectId, currentUser.id);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            leftAt: null,
          },
          select: projectMemberSelect,
          orderBy: {
            joinedAt: 'asc',
          },
        },
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            assignments: {
              orderBy: {
                assignedAt: 'asc',
              },
              take: 1,
              select: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          where: {
            taskId: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
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
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const tasksByStatus = this.buildTaskStatusSummary(
      project.tasks.map((task) => task.status),
    );

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      memberCount: project.members.length,
      tasksByStatus,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assignments[0]?.user ?? null,
      })),
      members: project.members,
      messages: project.messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        isSystem: message.isSystem,
        isAnnouncement: message.isAnnouncement,
        sender: message.sender,
      })),
      recentActivity: this.buildRecentActivity(project.messages),
    };
  }

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

  async updateProject(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: UpdateProjectDto,
  ): Promise<ProjectView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteProject(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectView> {
    await this.permission.ensureProjectOwner(projectId, currentUser.id);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return project;
  }

  async leaveProject(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView> {
    const membership = await this.permission.ensureActiveMember(
      projectId,
      currentUser.id,
    );

    if (membership.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Project owners must transfer ownership before leaving the project.',
      );
    }

    return this.prisma.projectMember.update({
      where: { id: membership.id },
      data: {
        leftAt: new Date(),
      },
      select: projectMemberSelect,
    });
  }

  async transferOwnership(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: TransferProjectOwnershipDto,
  ): Promise<ProjectMemberView> {
    const ownerMembership = await this.permission.ensureProjectOwner(
      projectId,
      currentUser.id,
    );
    const targetMembership = await this.permission.ensureProjectHasMember(
      projectId,
      dto.targetMemberId,
    );
    const targetUser = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: targetMembership.userId,
      },
      select: {
        email: true,
      },
    });

    if (targetMembership.leftAt) {
      throw new ConflictException('Cannot transfer ownership to an inactive member.');
    }

    if (targetMembership.id === ownerMembership.id) {
      throw new ConflictException('Select a different member to transfer ownership.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.update({
        where: { id: ownerMembership.id },
        data: {
          role: ProjectRole.ADMIN,
        },
      });

      await tx.projectMember.update({
        where: { id: targetMembership.id },
        data: {
          role: ProjectRole.OWNER,
        },
      });
    });

    this.eventEmitter.emit(
      MessageEventNames.PROJECT_OWNERSHIP_TRANSFERRED,
      new ProjectOwnershipTransferredEvent(
        projectId,
        currentUser.id,
        targetMembership.userId,
        currentUser.email,
        targetUser.email,
      ),
    );

    return this.prisma.projectMember.findUniqueOrThrow({
      where: { id: targetMembership.id },
      select: projectMemberSelect,
    });
  }

  async addMember(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: AddMemberDto,
  ): Promise<ProjectMemberView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);

    if (dto.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Project ownership cannot be granted through adding a member.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    const { member, isReactivated } = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.projectMember.findUnique({
        where: {
          userId_projectId: {
            projectId,
            userId: targetUser.id,
          },
        },
      });

      if (existing && existing.leftAt === null) {
        throw new ConflictException('User is already an active project member.');
      }

      if (existing) {
        const member = await tx.projectMember.update({
          where: { id: existing.id },
          data: {
            leftAt: null,
            role: dto.role,
          },
          select: projectMemberSelect,
        });

        return { member, isReactivated: true };
      }

      const member = await tx.projectMember.create({
        data: {
          projectId,
          userId: targetUser.id,
          role: dto.role,
        },
        select: projectMemberSelect,
      });

      return { member, isReactivated: false };
    });

    if (isReactivated) {
      this.eventEmitter.emit(
        MessageEventNames.PROJECT_MEMBER_REACTIVATED,
        new ProjectMemberReactivatedEvent(
          projectId,
          targetUser.id,
          dto.role,
          currentUser.id,
          currentUser.email,
          targetUser.email,
        ),
      );
    } else {
      this.eventEmitter.emit(
        MessageEventNames.PROJECT_MEMBER_ADDED,
        new ProjectMemberAddedEvent(
          projectId,
          targetUser.id,
          dto.role,
          currentUser.id,
          currentUser.email,
          targetUser.email,
        ),
      );
    }

    return member;
  }

  async listMembers(
    projectId: number,
    currentUser: AuthenticatedUser,
    query?: ListProjectMembersQueryDto,
  ): Promise<ProjectMemberView[]> {
    await this.permission.ensureActiveMember(projectId, currentUser.id);

    const normalizedSearch = query?.search?.trim();

    return this.prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null,
        ...(query?.role ? { role: query.role } : {}),
        ...(normalizedSearch
          ? {
              OR: [
                {
                  user: {
                    email: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  user: {
                    name: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        joinedAt: 'asc',
      },
      select: projectMemberSelect,
    });
  }

  async updateMemberRole(
    projectId: number,
    memberId: number,
    currentUser: AuthenticatedUser,
    dto: UpdateProjectMemberRoleDto,
  ): Promise<ProjectMemberView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);
    const membership =
      await this.permission.ensureProjectHasMember(projectId, memberId);

    if (membership.leftAt) {
      throw new ConflictException('Member is no longer active in this project.');
    }

    if (membership.userId === currentUser.id) {
      throw new ConflictException(
        'Use a dedicated self-service flow to change your own project role.',
      );
    }

    if (membership.role === ProjectRole.OWNER || dto.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Ownership changes are not supported from the generic role update flow.',
      );
    }

    const updatedMembership = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: { id: membership.id },
        data: {
          role: dto.role,
        },
        select: projectMemberSelect,
      });

      return updated;
    });

    this.eventEmitter.emit(
      MessageEventNames.PROJECT_MEMBER_ROLE_CHANGED,
      new ProjectMemberRoleChangedEvent(
        projectId,
        updatedMembership.user.id,
        membership.role,
        dto.role,
        currentUser.id,
        currentUser.email,
        updatedMembership.user.email,
      ),
    );

    return updatedMembership;
  }

  async removeMember(
    projectId: number,
    memberId: number,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);
    const membership =
      await this.permission.ensureProjectHasMember(projectId, memberId);

    if (membership.leftAt) {
      throw new ConflictException('Member already removed.');
    }

    if (membership.userId === currentUser.id) {
      throw new ConflictException(
        'Use a dedicated leave-project flow instead of removing your own membership.',
      );
    }

    if (membership.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'Project owners cannot be removed until ownership transfer is supported.',
      );
    }

    const removedMembership = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.projectMember.update({
        where: { id: membership.id },
        data: {
          leftAt: new Date(),
        },
        select: projectMemberSelect,
      });

      return removed;
    });

    this.eventEmitter.emit(
      MessageEventNames.PROJECT_MEMBER_REMOVED,
      new ProjectMemberRemovedEvent(
        projectId,
        removedMembership.user.id,
        membership.role,
        currentUser.id,
        currentUser.email,
        removedMembership.user.email,
      ),
    );

    return removedMembership;
  }

  private buildTaskStatusSummary(taskStatuses: TaskStatus[]) {
    return {
      TODO: taskStatuses.filter((status) => status === TaskStatus.TODO).length,
      IN_PROGRESS: taskStatuses.filter(
        (status) => status === TaskStatus.IN_PROGRESS,
      ).length,
      IN_REVIEW: taskStatuses.filter(
        (status) => status === TaskStatus.IN_REVIEW,
      ).length,
      DONE: taskStatuses.filter((status) => status === TaskStatus.DONE).length,
      BLOCKED: taskStatuses.filter((status) => status === TaskStatus.BLOCKED)
        .length,
    };
  }

  private deriveProjectStatus(input: {
    totalTasks: number;
    completedTaskCount: number;
    blockedTaskCount: number;
  }): ProjectStatusView {
    if (input.totalTasks === 0) {
      return 'PLANNING';
    }

    if (input.completedTaskCount === input.totalTasks) {
      return 'COMPLETED';
    }

    if (input.blockedTaskCount > 0) {
      return 'AT_RISK';
    }

    return 'ACTIVE';
  }

  private deriveProjectProgress(totalTasks: number, completedTaskCount: number) {
    if (totalTasks === 0) {
      return 0;
    }

    return Math.round((completedTaskCount / totalTasks) * 100);
  }

  private async getProjectsTaskStats(
    projectIds: number[],
  ): Promise<Map<number, { total: number; completed: number; blocked: number }>> {
    const statsMap = new Map<number, { total: number; completed: number; blocked: number }>();
    if (projectIds.length === 0) {
      return statsMap;
    }

    const taskStats = await this.prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: {
        projectId: { in: projectIds },
      },
      _count: {
        id: true,
      },
    });

    for (const stat of taskStats) {
      const projectId = stat.projectId;
      const status = stat.status;
      const count = stat._count.id;

      if (!statsMap.has(projectId)) {
        statsMap.set(projectId, { total: 0, completed: 0, blocked: 0 });
      }

      const projectStat = statsMap.get(projectId)!;
      projectStat.total += count;
      if (status === TaskStatus.DONE) {
        projectStat.completed += count;
      } else if (status === TaskStatus.BLOCKED) {
        projectStat.blocked += count;
      }
    }

    return statsMap;
  }

  private mapProjectListItem(
    project: {
      id: number;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      _count: {
        members: number;
      };
    },
    taskStats: { total: number; completed: number; blocked: number },
  ): ProjectListItemView {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      memberCount: project._count.members,
      totalTasks: taskStats.total,
      completedTaskCount: taskStats.completed,
      blockedTaskCount: taskStats.blocked,
    };
  }

  private mapProjectCatalogItem(
    project: {
      id: number;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      _count: {
        members: number;
      };
    },
    taskStats: { total: number; completed: number; blocked: number },
  ): ProjectCatalogItemView {
    const summary = this.mapProjectListItem(project, taskStats);

    return {
      ...summary,
      status: this.deriveProjectStatus(summary),
      progress: this.deriveProjectProgress(
        summary.totalTasks,
        summary.completedTaskCount,
      ),
    };
  }

  private buildRecentActivity(
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
