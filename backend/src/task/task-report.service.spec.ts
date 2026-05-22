import { ReportStatus, TaskStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { TaskReportService } from './task-report.service';
import { TaskPermissionService } from './task-permission.service';
import { MessageEventNames, TaskReportReviewedEvent } from '../message/events/message.events';

describe('TaskReportService', () => {
  const prisma = {
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const taskPermissionService = {
    ensureLeadCanReviewReport: jest.fn(),
  } as unknown as TaskPermissionService;
  const eventEmitter = {
    emit: jest.fn(),
  } as unknown as EventEmitter2;

  let service: TaskReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TaskReportService(
      prisma,
      taskPermissionService,
      eventEmitter,
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
        findMany: jest.fn().mockResolvedValue([
          { authorId: 9 },
        ]),
      },
      taskAssignment: {
        findMany: jest.fn().mockResolvedValue([
          { userId: 9 },
        ]),
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
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      MessageEventNames.TASK_REPORT_REVIEWED,
      new TaskReportReviewedEvent(
        5,
        18,
        31,
        ReportStatus.APPROVED,
        true,
        'linh.tran@projecthub.dev',
      ),
    );
  });
});
