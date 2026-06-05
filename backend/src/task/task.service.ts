import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import {
  MessageEventNames,
  TaskCreatedEvent,
  TaskAssignedEvent,
  TaskStatusChangedEvent,
  TaskPriorityChangedEvent,
} from '../message/events/message.events';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskPermissionService: TaskPermissionService,
    private readonly eventEmitter: EventEmitter2,
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

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          projectId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          priority: dto.priority ?? 'MEDIUM',
        },
        select: taskSelect,
      });

      return created;
    });

    this.eventEmitter.emit(
      MessageEventNames.TASK_CREATED,
      new TaskCreatedEvent(
        projectId,
        task.id,
        task.title,
        currentUser.id,
        task.priority,
        currentUser.email,
      ),
    );

    return task;
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
    });

    this.eventEmitter.emit(
      MessageEventNames.TASK_ASSIGNED,
      new TaskAssignedEvent(
        task.projectId,
        taskId,
        dto.assignees.map((assignee) => assignee.userId),
        currentUser.id,
        currentUser.email,
      ),
    );

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
    const { task: existingTask } = await this.taskPermissionService.ensureCanUpdateStatus(
      taskId,
      currentUser.id,
      dto.status,
    );

    if (dto.version !== undefined && existingTask.version !== dto.version) {
      throw new ConflictException(
        'Task version mismatch. The task has been modified by another transaction.',
      );
    }

    const versionCond = dto.version !== undefined ? dto.version : existingTask.version;
    let task;
    try {
      task = await this.prisma.task.update({
        where: { id: taskId, version: versionCond },
        data: {
          status: dto.status,
          version: { increment: 1 },
        },
        select: taskSelect,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ConflictException(
          'Task version mismatch. The task has been modified by another transaction.',
        );
      }
      throw error;
    }

    this.eventEmitter.emit(
      MessageEventNames.TASK_STATUS_CHANGED,
      new TaskStatusChangedEvent(
        task.projectId,
        taskId,
        dto.status,
        currentUser.id,
        currentUser.email,
      ),
    );

    return task;
  }

  async updateTask(
    taskId: number,
    currentUser: AuthenticatedUser,
    dto: UpdateTaskDto,
  ): Promise<TaskView> {
    const { task: existingTask } =
      await this.taskPermissionService.ensureCanManageTask(
        taskId,
        currentUser.id,
      );

    if (dto.version !== undefined && existingTask.version !== dto.version) {
      throw new ConflictException(
        'Task version mismatch. The task has been modified by another transaction.',
      );
    }

    const nextTitle = dto.title !== undefined ? dto.title.trim() : undefined;
    const nextDescription =
      dto.description !== undefined ? dto.description.trim() || null : undefined;
    const nextPriority = dto.priority !== undefined ? dto.priority : undefined;

    const versionCond = dto.version !== undefined ? dto.version : existingTask.version;
    let task;
    try {
      task = await this.prisma.task.update({
        where: { id: taskId, version: versionCond },
        data: {
          ...(nextTitle !== undefined ? { title: nextTitle } : {}),
          ...(nextDescription !== undefined ? { description: nextDescription } : {}),
          ...(nextPriority !== undefined ? { priority: nextPriority } : {}),
          version: { increment: 1 },
        },
        select: taskSelect,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ConflictException(
          'Task version mismatch. The task has been modified by another transaction.',
        );
      }
      throw error;
    }

    if (nextPriority !== undefined && existingTask.priority !== nextPriority) {
      this.eventEmitter.emit(
        MessageEventNames.TASK_PRIORITY_CHANGED,
        new TaskPriorityChangedEvent(
          task.projectId,
          taskId,
          existingTask.priority,
          nextPriority,
          currentUser.id,
          currentUser.email,
        ),
      );
    }

    return task;
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
