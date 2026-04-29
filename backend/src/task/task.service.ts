import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { AssignTaskUsersDto } from './dto/assign-task-users.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { taskAssignmentSelect, taskSelect } from './task.constants';
import { TaskAssignmentView, TaskCatalogView, TaskView } from './task.types';
import { TaskPermissionService } from './task-permission.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskPermissionService: TaskPermissionService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
  ) {}

  async listTasks(
    currentUser: AuthenticatedUser,
    query: ListTasksQueryDto,
  ): Promise<TaskCatalogView> {
    const normalizedSearch = query.search?.trim();
    const where = {
      project: {
        members: {
          some: {
            userId: currentUser.id,
            leftAt: null,
          },
        },
      },
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assigneeId
        ? {
            assignments: {
              some: {
                userId: query.assigneeId,
              },
            },
          }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                title: {
                  contains: normalizedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: normalizedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                assignments: {
                  some: {
                    user: {
                      OR: [
                        {
                          email: {
                            contains: normalizedSearch,
                            mode: 'insensitive' as const,
                          },
                        },
                        {
                          name: {
                            contains: normalizedSearch,
                            mode: 'insensitive' as const,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const total = await this.prisma.task.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const items = await this.prisma.task.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * query.pageSize,
      take: query.pageSize,
      select: taskSelect,
    });

    return {
      items,
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    };
  }

  async createTask(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: CreateTaskDto,
  ): Promise<TaskView> {
    await this.taskPermissionService.ensureCanCreateTask(projectId, currentUser.id);

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          priority: dto.priority ?? 'MEDIUM',
        },
        select: taskSelect,
      });

      await this.messageService.createSystemMessage(
        {
          projectId,
          taskId: task.id,
          content: `${currentUser.email} created task ${task.title}.`,
          metadata: {
            type: 'TASK_CREATED',
            taskId: task.id,
            createdById: currentUser.id,
            priority: task.priority,
          },
        },
        tx,
      );

      return task;
    });
  }

  async assignUsers(
    taskId: number,
    currentUser: AuthenticatedUser,
    dto: AssignTaskUsersDto,
  ): Promise<TaskAssignmentView[]> {
    const { task } = await this.taskPermissionService.ensureCanAssignUsers(
      taskId,
      currentUser.id,
    );

    await this.taskPermissionService.ensureAssignableMembers(
      task.projectId,
      dto.assignees.map((assignee) => assignee.userId),
    );

    const existingAssignments = await this.prisma.taskAssignment.findMany({
      where: {
        taskId,
        userId: {
          in: dto.assignees.map((assignee) => assignee.userId),
        },
      },
      select: {
        userId: true,
      },
    });

    if (existingAssignments.length > 0) {
      throw new ConflictException('One or more users are already assigned to this task.');
    }

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        dto.assignees.map((assignee) =>
          tx.taskAssignment.create({
            data: {
              taskId,
              userId: assignee.userId,
              role: assignee.role,
              assignedById: currentUser.id,
            },
          }),
        ),
      );

      const activity = await this.messageService.createSystemMessage(
        {
          projectId: task.projectId,
          taskId,
          content: `${currentUser.email} assigned users to the task.`,
          metadata: {
            type: 'TASK_ASSIGNED',
            taskId,
            assignedUserIds: dto.assignees.map((assignee) => assignee.userId),
            assignedById: currentUser.id,
          },
        },
        tx,
      );

      await this.notificationService.createNotifications(
        {
          activityId: activity.id,
          type: NotificationType.ASSIGNED,
          recipientIds: dto.assignees.map((assignee) => assignee.userId),
        },
        tx,
      );
    });

    return this.prisma.taskAssignment.findMany({
      where: {
        taskId,
        userId: {
          in: dto.assignees.map((assignee) => assignee.userId),
        },
      },
      orderBy: {
        id: 'asc',
      },
      select: taskAssignmentSelect,
    });
  }

  async updateStatus(
    taskId: number,
    currentUser: AuthenticatedUser,
    dto: UpdateTaskStatusDto,
  ): Promise<TaskView> {
    await this.taskPermissionService.ensureCanUpdateStatus(
      taskId,
      currentUser.id,
      dto.status,
    );

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          status: dto.status,
        },
        select: taskSelect,
      });

      const activity = await this.messageService.createSystemMessage(
        {
          projectId: task.projectId,
          taskId,
          content: `${currentUser.email} changed task status to ${dto.status}.`,
          metadata: {
            type: 'TASK_STATUS_CHANGED',
            taskId,
            status: dto.status,
            changedById: currentUser.id,
          },
        },
        tx,
      );

      const recipients = task.assignments
        .map((assignment) => assignment.user.id)
        .filter((userId) => userId !== currentUser.id);

      await this.notificationService.createNotifications(
        {
          activityId: activity.id,
          type: NotificationType.STATUS_CHANGED,
          recipientIds: recipients,
        },
        tx,
      );

      return task;
    });
  }

  async updateTask(
    taskId: number,
    currentUser: AuthenticatedUser,
    dto: UpdateTaskDto,
  ): Promise<TaskView> {
    await this.taskPermissionService.ensureCanManageTask(taskId, currentUser.id);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      },
      select: taskSelect,
    });
  }

  async updateAssignment(
    taskId: number,
    assignmentId: number,
    currentUser: AuthenticatedUser,
    dto: UpdateTaskAssignmentDto,
  ): Promise<TaskAssignmentView> {
    await this.taskPermissionService.ensureCanManageAssignment(
      taskId,
      assignmentId,
      currentUser.id,
    );

    return this.prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        role: dto.role,
      },
      select: taskAssignmentSelect,
    });
  }

  async removeAssignment(
    taskId: number,
    assignmentId: number,
    currentUser: AuthenticatedUser,
  ): Promise<TaskAssignmentView> {
    await this.taskPermissionService.ensureCanManageAssignment(
      taskId,
      assignmentId,
      currentUser.id,
    );

    return this.prisma.taskAssignment.delete({
      where: { id: assignmentId },
      select: taskAssignmentSelect,
    });
  }

  async deleteTask(
    taskId: number,
    currentUser: AuthenticatedUser,
  ): Promise<TaskView> {
    await this.taskPermissionService.ensureCanManageTask(taskId, currentUser.id);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: taskSelect,
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return task;
  }
}
