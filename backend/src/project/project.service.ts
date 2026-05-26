import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectCatalogQueryDto } from './dto/list-project-catalog-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { projectMemberSelect } from './project.constants';
import {
  ProjectCatalogItemView,
  ProjectCatalogView,
  ProjectDetailView,
  ProjectListItemView,
  ProjectStatusView,
  ProjectView,
} from './project.types';
import { ProjectPermissionService } from './project-permission.service';
import { ProjectActivityService } from './project-activity.service';
import { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
    private readonly projectActivity: ProjectActivityService,
  ) {}

  /**
   * Tạo dự án mới và tự động gán tài khoản tạo làm OWNER
   */
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

  /**
   * Lấy danh sách toàn bộ dự án mà người dùng đang tham gia
   */
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

  /**
   * Lấy danh sách dự án dạng Catalog (hỗ trợ tìm kiếm, phân trang và lọc theo trạng thái tổng hợp)
   */
  async listProjectCatalog(
    currentUser: AuthenticatedUser,
    query: ListProjectCatalogQueryDto,
  ): Promise<ProjectCatalogView> {
    // 1. Phân tích điều kiện lọc theo trạng thái ảo (statusFilter) ở mức DB level
    let statusFilter: Prisma.ProjectWhereInput = {};
    if (query.status) {
      if (query.status === 'PLANNING') {
        statusFilter = { tasks: { none: {} } };
      } else if (query.status === 'COMPLETED') {
        statusFilter = {
          tasks: {
            some: {},
            every: { status: 'DONE' },
          },
        };
      } else if (query.status === 'AT_RISK') {
        statusFilter = {
          tasks: {
            some: { status: 'BLOCKED' },
          },
        };
      } else if (query.status === 'ACTIVE') {
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

    // 2. Chạy đồng thời truy vấn phân trang qua parallel $transaction
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

    // 3. Ánh xạ các item dạng Catalog
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

  /**
   * Lấy thông tin chi tiết của dự án (members, tasks, messages, recent activity)
   */
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
      // Ủy thác logic xử lý recent activity cho ProjectActivityService
      recentActivity: this.projectActivity.buildRecentActivity(project.messages),
    };
  }

  /**
   * Cập nhật thông tin dự án
   */
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

  /**
   * Xóa dự án (Chỉ cho phép OWNER)
   */
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
}
