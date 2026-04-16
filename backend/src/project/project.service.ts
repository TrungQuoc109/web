import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole, TaskStatus } from '@prisma/client';
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

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
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
        members: {
          where: {
            leftAt: null,
          },
          select: {
            id: true,
          },
        },
        tasks: {
          select: {
            status: true,
          },
        },
      },
    });

    return projects.map((project) => this.mapProjectListItem(project));
  }

  async listProjectCatalog(
    currentUser: AuthenticatedUser,
    query: ListProjectCatalogQueryDto,
  ): Promise<ProjectCatalogView> {
    const projects = await this.prisma.project.findMany({
      where: {
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
        members: {
          where: {
            leftAt: null,
          },
          select: {
            id: true,
          },
        },
        tasks: {
          select: {
            status: true,
          },
        },
      },
    });

    const catalogItems = projects
      .map((project) => this.mapProjectCatalogItem(project))
      .filter((project) => (query.status ? project.status === query.status : true));
    const total = catalogItems.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;

    return {
      items: catalogItems.slice(start, start + query.pageSize),
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

    const normalizedEmail = dto.email.trim().toLowerCase();
    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.$transaction(async (tx) => {
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
        return tx.projectMember.update({
          where: { id: existing.id },
          data: {
            leftAt: null,
            role: dto.role,
          },
          select: projectMemberSelect,
        });
      }

      return tx.projectMember.create({
        data: {
          projectId,
          userId: targetUser.id,
          role: dto.role,
        },
        select: projectMemberSelect,
      });
    });
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

    return this.prisma.projectMember.update({
      where: { id: membership.id },
      data: {
        role: dto.role,
      },
      select: projectMemberSelect,
    });
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

    return this.prisma.projectMember.update({
      where: { id: membership.id },
      data: {
        leftAt: new Date(),
      },
      select: projectMemberSelect,
    });
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

  private mapProjectListItem(project: {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    members: { id: number }[];
    tasks: { status: TaskStatus }[];
  }): ProjectListItemView {
    const totalTasks = project.tasks.length;
    const completedTaskCount = project.tasks.filter(
      (task) => task.status === TaskStatus.DONE,
    ).length;
    const blockedTaskCount = project.tasks.filter(
      (task) => task.status === TaskStatus.BLOCKED,
    ).length;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      memberCount: project.members.length,
      totalTasks,
      completedTaskCount,
      blockedTaskCount,
    };
  }

  private mapProjectCatalogItem(project: {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    members: { id: number }[];
    tasks: { status: TaskStatus }[];
  }): ProjectCatalogItemView {
    const summary = this.mapProjectListItem(project);

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
      sender: {
        id: number;
        email: string;
        name: string | null;
      } | null;
    }[],
  ): ProjectActivityView[] {
    return messages.slice(0, 5).map((message) => {
      const authorName = message.sender?.name ?? message.sender?.email ?? 'System';
      const prefix = message.isAnnouncement
        ? 'Announcement'
        : message.isSystem
          ? 'System update'
          : 'Project message';

      return {
        id: `activity-${message.id}`,
        title: `${prefix} by ${authorName}`,
        description: message.content,
        timestamp: message.createdAt,
      };
    });
  }
}
