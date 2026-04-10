import { ConflictException, Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { AssignTaskUsersDto } from './dto/assign-task-users.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { taskAssignmentSelect, taskSelect } from './task.constants';
import { TaskAssignmentView, TaskView } from './task.types';
import { TaskPermissionService } from './task-permission.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskPermissionService: TaskPermissionService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
  ) {}

  async createTask(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: CreateTaskDto,
  ): Promise<TaskView> {
    await this.taskPermissionService.ensureCanCreateTask(projectId, currentUser.id);

    return this.prisma.task.create({
      data: {
        projectId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priority: dto.priority ?? 'MEDIUM',
      },
      select: taskSelect,
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
}
