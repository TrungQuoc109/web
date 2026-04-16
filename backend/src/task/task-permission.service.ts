import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ReportStatus,
  ProjectRole,
  TaskAssignmentRole,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectPermissionService } from '../project/project-permission.service';

const statusTransitions: Record<TaskStatus, TaskStatus[]> = {
  TODO: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  IN_PROGRESS: [TaskStatus.TODO, TaskStatus.IN_REVIEW, TaskStatus.BLOCKED],
  IN_REVIEW: [TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.BLOCKED],
  DONE: [],
  BLOCKED: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
};

@Injectable()
export class TaskPermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectPermissionService: ProjectPermissionService,
  ) {}

  async ensureCanCreateTask(projectId: number, userId: number) {
    const membership = await this.projectPermissionService.ensureActiveMember(
      projectId,
      userId,
    );

    if (membership.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot create tasks.');
    }

    return membership;
  }

  async ensureTaskExists(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    return task;
  }

  async ensureCanViewTask(taskId: number, userId: number) {
    const task = await this.ensureTaskExists(taskId);
    await this.projectPermissionService.ensureActiveMember(task.projectId, userId);
    return task;
  }

  async ensureCanAssignUsers(taskId: number, userId: number) {
    const task = await this.ensureTaskExists(taskId);
    const membership = await this.projectPermissionService.ensureActiveMember(
      task.projectId,
      userId,
    );

    if (membership.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot assign task users.');
    }

    return { task, membership };
  }

  async ensureCanManageTask(taskId: number, userId: number) {
    const task = await this.ensureTaskExists(taskId);
    const membership = await this.projectPermissionService.ensureActiveMember(
      task.projectId,
      userId,
    );

    if (membership.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot manage tasks.');
    }

    return { task, membership };
  }

  async ensureCanUpdateStatus(taskId: number, userId: number, nextStatus: TaskStatus) {
    const task = await this.ensureTaskExists(taskId);
    const membership = await this.projectPermissionService.ensureActiveMember(
      task.projectId,
      userId,
    );

    if (membership.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot update task status.');
    }

    if (nextStatus === TaskStatus.DONE) {
      throw new ForbiddenException(
        'Task completion must happen through task report approval.',
      );
    }

    this.ensureValidStatusTransition(task.status, nextStatus);

    return { task, membership };
  }

  async ensureContributorCanSubmitReport(taskId: number, userId: number) {
    const task = await this.ensureTaskExists(taskId);
    await this.projectPermissionService.ensureActiveMember(task.projectId, userId);

    if (task.status === TaskStatus.DONE) {
      throw new ConflictException('Cannot submit a report for a completed task.');
    }

    const assignment = await this.prisma.taskAssignment.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId,
        },
      },
    });

    if (!assignment || assignment.role !== TaskAssignmentRole.CONTRIBUTOR) {
      throw new ForbiddenException('Only task contributors can submit reports.');
    }

    return task;
  }

  async ensureLeadCanReviewReport(
    reportId: number,
    userId: number,
    nextStatus: ReportStatus,
  ) {
    const reviewStatuses: ReportStatus[] = [
      ReportStatus.APPROVED,
      ReportStatus.REJECTED,
    ];

    if (!reviewStatuses.includes(nextStatus)) {
      throw new ConflictException('Report review must be APPROVED or REJECTED.');
    }

    const report = await this.prisma.taskReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Task report not found.');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new ConflictException('Only pending reports can be reviewed.');
    }

    const task = await this.ensureTaskExists(report.taskId);
    await this.projectPermissionService.ensureActiveMember(task.projectId, userId);

    const assignment = await this.prisma.taskAssignment.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId: task.id,
        },
      },
    });

    if (!assignment || assignment.role !== TaskAssignmentRole.LEAD) {
      throw new ForbiddenException('Only the task lead can review task reports.');
    }

    if (nextStatus === ReportStatus.APPROVED) {
      if (task.status !== TaskStatus.IN_REVIEW) {
        throw new ConflictException(
          'Task must be in IN_REVIEW before a report can be approved.',
        );
      }

      const contributorAssignments = await this.prisma.taskAssignment.findMany({
        where: {
          taskId: task.id,
          role: TaskAssignmentRole.CONTRIBUTOR,
        },
        select: {
          userId: true,
        },
      });

      const reports = await this.prisma.taskReport.findMany({
        where: {
          taskId: task.id,
          status: {
            in: [ReportStatus.PENDING, ReportStatus.APPROVED],
          },
          authorId: {
            in: contributorAssignments.map((assignment) => assignment.userId),
          },
        },
        select: {
          authorId: true,
        },
      });

      const reportedUserIds = new Set(reports.map((item) => item.authorId));
      const missingReport = contributorAssignments.some(
        (assignmentItem) => !reportedUserIds.has(assignmentItem.userId),
      );

      if (missingReport) {
        throw new ConflictException(
          'All contributors must submit a report before approval can complete the task.',
        );
      }
    }

    return { report, task, assignment };
  }

  async ensureAssignableMembers(projectId: number, userIds: number[]) {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length !== userIds.length) {
      throw new ConflictException('Duplicate users cannot be assigned to the same task.');
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null,
        userId: {
          in: uniqueUserIds,
        },
      },
      select: {
        userId: true,
      },
    });

    if (memberships.length !== uniqueUserIds.length) {
      throw new ForbiddenException('Only active project members can be assigned to tasks.');
    }
  }

  private ensureValidStatusTransition(currentStatus: TaskStatus, nextStatus: TaskStatus) {
    if (currentStatus === nextStatus) {
      throw new ConflictException('Task is already in the requested status.');
    }

    if (!statusTransitions[currentStatus].includes(nextStatus)) {
      throw new ConflictException(
        `Invalid task status transition from ${currentStatus} to ${nextStatus}.`,
      );
    }
  }
}
