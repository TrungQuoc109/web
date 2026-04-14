import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { projectMemberSelect } from './project.constants';
import {
  ProjectActivityView,
  ProjectDetailView,
  ProjectListItemView,
  ProjectMemberView,
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

    return projects.map((project) => {
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
    });
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
  ): Promise<ProjectMemberView[]> {
    await this.permission.ensureActiveMember(projectId, currentUser.id);

    return this.prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null,
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
