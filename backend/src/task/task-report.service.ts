import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { NotificationType, ReportStatus, TaskStatus, TaskAssignmentRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewTaskReportDto } from './dto/review-task-report.dto';
import { SubmitTaskReportDto } from './dto/submit-task-report.dto';
import { taskReportSelect } from './task-report.constants';
import { TaskReportView } from './task-report.types';
import { TaskPermissionService } from './task-permission.service';

@Injectable()
export class TaskReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskPermissionService: TaskPermissionService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
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

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.taskReport.create({
        data: {
          taskId,
          authorId: currentUser.id,
          content: dto.content.trim(),
          attachments: dto.attachments ?? [],
        },
        select: taskReportSelect,
      });

      const activity = await this.messageService.createSystemMessage(
        {
          projectId: task.projectId,
          taskId,
          content: `${currentUser.email} submitted a task report.`,
          metadata: {
            type: 'TASK_REPORT_SUBMITTED',
            taskId,
            reportId: report.id,
            authorId: currentUser.id,
          },
        },
        tx,
      );

      const recipients = await tx.taskAssignment.findMany({
        where: {
          taskId,
          userId: {
            not: currentUser.id,
          },
        },
        select: {
          userId: true,
        },
      });

      await this.notificationService.createNotifications(
        {
          activityId: activity.id,
          type: NotificationType.ANNOUNCEMENT,
          recipientIds: recipients.map((recipient) => recipient.userId),
        },
        tx,
      );

      return report;
    });
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

    return this.prisma.$transaction(async (tx) => {
      const updatedReport = await tx.taskReport.update({
        where: { id: reportId },
        data: {
          status: dto.status,
          feedback,
        },
        select: taskReportSelect,
      });

      let allApproved = false;

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
        approvedUserIds.add(updatedReport.authorId);

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

      const activity = await this.messageService.createSystemMessage(
        {
          projectId: task.projectId,
          taskId: task.id,
          content:
            dto.status === ReportStatus.APPROVED
              ? (allApproved 
                  ? `${currentUser.email} approved a task report and completed the task.`
                  : `${currentUser.email} approved a task report.`)
              : `${currentUser.email} rejected a task report.`,
          metadata: {
            type:
              dto.status === ReportStatus.APPROVED
                ? 'TASK_REPORT_APPROVED'
                : 'TASK_REPORT_REJECTED',
            taskId: task.id,
            reportId,
            reviewerId: currentUser.id,
          },
        },
        tx,
      );

      await this.notificationService.createNotifications(
        {
          activityId: activity.id,
          type: NotificationType.ANNOUNCEMENT,
          recipientIds: [updatedReport.authorId].filter(
            (recipientId) => recipientId !== currentUser.id,
          ),
        },
        tx,
      );

      return updatedReport;
    });
  }
}
