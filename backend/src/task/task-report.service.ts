import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ReportStatus, TaskStatus, TaskAssignmentRole } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewTaskReportDto } from './dto/review-task-report.dto';
import { SubmitTaskReportDto } from './dto/submit-task-report.dto';
import { taskReportSelect } from './task-report.constants';
import { TaskReportView } from './task-report.types';
import { TaskPermissionService } from './task-permission.service';
import {
  MessageEventNames,
  TaskReportSubmittedEvent,
  TaskReportReviewedEvent,
} from '../message/events/message.events';

@Injectable()
export class TaskReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskPermissionService: TaskPermissionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listReports(
    taskId: number,
    currentUser: AuthenticatedUser,
  ): Promise<TaskReportView[]> {
    await this.taskPermissionService.ensureCanViewTask(taskId, currentUser.id);

    return this.prisma.taskReport.findMany({
      where: {
        taskId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: taskReportSelect,
    });
  }

  async submitReport(
    taskId: number,
    currentUser: AuthenticatedUser,
    dto: SubmitTaskReportDto,
  ): Promise<TaskReportView> {
    const task = await this.taskPermissionService.ensureContributorCanSubmitReport(
      taskId,
      currentUser.id,
    );

    const existingReport = await this.prisma.taskReport.findFirst({
      where: {
        taskId,
        authorId: currentUser.id,
        status: {
          in: [ReportStatus.PENDING, ReportStatus.APPROVED],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingReport) {
      throw new ConflictException(
        'A pending or approved report already exists for this contributor.',
      );
    }

    const report = await this.prisma.taskReport.create({
      data: {
        taskId,
        authorId: currentUser.id,
        content: dto.content.trim(),
        attachments: dto.attachments ?? [],
      },
      select: taskReportSelect,
    });

    this.eventEmitter.emit(
      MessageEventNames.TASK_REPORT_SUBMITTED,
      new TaskReportSubmittedEvent(
        task.projectId,
        taskId,
        report.id,
        currentUser.id,
        currentUser.email,
      ),
    );

    return report;
  }

  async reviewReport(
    reportId: number,
    currentUser: AuthenticatedUser,
    dto: ReviewTaskReportDto,
  ): Promise<TaskReportView> {
    const { task } = await this.taskPermissionService.ensureLeadCanReviewReport(
      reportId,
      currentUser.id,
      dto.status,
    );

    const feedback =
      dto.status === ReportStatus.REJECTED
        ? dto.rejectionReason!.trim()
        : dto.feedback?.trim() || null;

    let allApproved = false;

    const updatedReport = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.taskReport.update({
        where: { id: reportId },
        data: {
          status: dto.status,
          feedback,
        },
        select: taskReportSelect,
      });

      if (dto.status === ReportStatus.APPROVED) {
        const contributorAssignments = await tx.taskAssignment.findMany({
          where: {
            taskId: task.id,
            role: TaskAssignmentRole.CONTRIBUTOR,
          },
          select: { userId: true },
        });

        const approvedReports = await tx.taskReport.findMany({
          where: {
            taskId: task.id,
            status: ReportStatus.APPROVED,
          },
          select: { authorId: true },
        });

        const approvedUserIds = new Set(approvedReports.map(r => r.authorId));
        approvedUserIds.add(updated.authorId);

        allApproved = contributorAssignments.every(c => approvedUserIds.has(c.userId));

        if (allApproved) {
          await tx.task.update({
            where: { id: task.id },
            data: {
              status: TaskStatus.DONE,
            },
          });
        }
      }

      return updated;
    });

    this.eventEmitter.emit(
      MessageEventNames.TASK_REPORT_REVIEWED,
      new TaskReportReviewedEvent(
        task.projectId,
        task.id,
        reportId,
        dto.status,
        allApproved,
        currentUser.email,
      ),
    );

    return updatedReport;
  }
}
