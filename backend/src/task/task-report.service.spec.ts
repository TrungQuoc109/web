import { NotificationType, ReportStatus, TaskStatus } from '@prisma/client';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskReportService } from './task-report.service';
import { TaskPermissionService } from './task-permission.service';

describe('TaskReportService', () => {
  const prisma = {
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const taskPermissionService = {
    ensureLeadCanReviewReport: jest.fn(),
  } as unknown as TaskPermissionService;
  const messageService = {
    createSystemMessage: jest.fn(),
  } as unknown as MessageService;
  const notificationService = {
    createNotifications: jest.fn(),
  } as unknown as NotificationService;

  let service: TaskReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskReportService(
      prisma,
      taskPermissionService,
      messageService,
      notificationService,
    );
  });

  it('approves a report and completes the task', async () => {
    const currentUser = {
      id: 3,
      email: 'linh.tran@projecthub.dev',
      name: 'Linh Tran',
      role: 'MANAGER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tx = {
      taskReport: {
        update: jest.fn().mockResolvedValue({
          id: 31,
          status: ReportStatus.APPROVED,
          authorId: 9,
        }),
      },
      task: {
        update: jest.fn(),
      },
    };

    (taskPermissionService.ensureLeadCanReviewReport as jest.Mock).mockResolvedValue(
      {
        task: {
          id: 18,
          projectId: 5,
        },
      },
    );
    (messageService.createSystemMessage as jest.Mock).mockResolvedValue({
      id: 101,
    });
    (notificationService.createNotifications as jest.Mock).mockResolvedValue(
      undefined,
    );
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback(tx),
    );

    const result = await service.reviewReport(31, currentUser, {
      status: ReportStatus.APPROVED,
      feedback: 'Looks ready for release.',
    });

    expect(result.status).toBe(ReportStatus.APPROVED);
    expect(tx.task.update).toHaveBeenCalledWith({
      where: { id: 18 },
      data: {
        status: TaskStatus.DONE,
      },
    });
    expect(notificationService.createNotifications).toHaveBeenCalledWith(
      {
        activityId: 101,
        type: NotificationType.ANNOUNCEMENT,
        recipientIds: [9],
      },
      tx,
    );
  });
});
