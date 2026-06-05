import { Injectable } from '@nestjs/common';
import { ReportStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatusView } from '../project/project.types';
import {
  DashboardActivityView,
  DashboardAnalyticsView,
  DashboardOverviewView,
  DashboardTrendPointView,
} from './dashboard.types';

const DAY_MS = 24 * 60 * 60 * 1000;

function createTaskStatusSummary(): Record<TaskStatus, number> {
  return {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
    BLOCKED: 0,
  };
}

function createTaskPrioritySummary(): Record<TaskPriority, number> {
  return {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };
}

function createProjectHealthSummary(): Record<ProjectStatusView, number> {
  return {
    ACTIVE: 0,
    PLANNING: 0,
    AT_RISK: 0,
    COMPLETED: 0,
  };
}

function startOfDay(input: Date) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDayKey(input: Date) {
  return startOfDay(input).toISOString().slice(0, 10);
}

function createTrendPoints(now: Date): DashboardTrendPointView[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfDay(now).getTime() - (6 - index) * DAY_MS);

    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      created: 0,
      completed: 0,
      reviewed: 0,
    };
  });
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    currentUser: AuthenticatedUser,
  ): Promise<DashboardOverviewView> {
    const now = new Date();
    const sevenDaysAgo = new Date(startOfDay(now).getTime() - 6 * DAY_MS);
    const memberScope = {
      some: {
        userId: currentUser.id,
        leftAt: null,
      },
    };

    const [
      totalProjects,
      totalTasks,
      taskStatusStats,
      taskPriorityStats,
      reportStatusStats,
      projectMessagesLast7Days,
      recentMessages,
      planningCount,
      completedCount,
      atRiskCount,
      activeCount,
      recentTasks,
      recentReports,
      reviewedReports,
    ] = await Promise.all([
      // 1. Total projects user is active in
      this.prisma.project.count({
        where: {
          members: memberScope,
        },
      }),
      // 2. Total tasks in user's projects
      this.prisma.task.count({
        where: {
          project: {
            members: memberScope,
          },
        },
      }),
      // 3. Task counts grouped by status
      this.prisma.task.groupBy({
        by: ['status'],
        where: {
          project: {
            members: memberScope,
          },
        },
        _count: {
          _all: true,
        },
      }),
      // 4. Task counts grouped by priority
      this.prisma.task.groupBy({
        by: ['priority'],
        where: {
          project: {
            members: memberScope,
          },
        },
        _count: {
          _all: true,
        },
      }),
      // 5. Report counts grouped by status
      this.prisma.taskReport.groupBy({
        by: ['status'],
        where: {
          task: {
            project: {
              members: memberScope,
            },
          },
        },
        _count: {
          _all: true,
        },
      }),
      // 6. Project messages in the last 7 days
      this.prisma.message.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
          project: {
            members: memberScope,
          },
        },
      }),
      // 7. Recent messages
      this.prisma.message.findMany({
        where: {
          project: {
            members: memberScope,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 12,
        select: {
          id: true,
          content: true,
          createdAt: true,
          isSystem: true,
          isAnnouncement: true,
          sender: {
            select: {
              email: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      // 8. Project health: PLANNING count (no tasks)
      this.prisma.project.count({
        where: {
          members: memberScope,
          tasks: { none: {} },
        },
      }),
      // 9. Project health: COMPLETED count (all tasks are DONE, at least 1 task)
      this.prisma.project.count({
        where: {
          members: memberScope,
          tasks: {
            some: {},
            every: { status: 'DONE' },
          },
        },
      }),
      // 10. Project health: AT_RISK count (at least 1 BLOCKED task)
      this.prisma.project.count({
        where: {
          members: memberScope,
          tasks: {
            some: { status: 'BLOCKED' },
          },
        },
      }),
      // 11. Project health: ACTIVE count (has non-DONE tasks, no BLOCKED tasks)
      this.prisma.project.count({
        where: {
          members: memberScope,
          tasks: {
            some: { status: { not: 'DONE' } },
            none: { status: 'BLOCKED' },
          },
        },
      }),
      // 12. Recent tasks (created or updated in the last 7 days)
      this.prisma.task.findMany({
        where: {
          project: {
            members: memberScope,
          },
          OR: [
            { createdAt: { gte: sevenDaysAgo } },
            { updatedAt: { gte: sevenDaysAgo } },
          ],
        },
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // 13. Recent reports (created or updated in the last 7 days)
      this.prisma.taskReport.findMany({
        where: {
          task: {
            project: {
              members: memberScope,
            },
          },
          OR: [
            { createdAt: { gte: sevenDaysAgo } },
            { updatedAt: { gte: sevenDaysAgo } },
          ],
        },
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // 14. Non-pending reports for averageReviewHours calculation
      this.prisma.taskReport.findMany({
        where: {
          task: {
            project: {
              members: memberScope,
            },
          },
          status: { not: 'PENDING' },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Map task status stats from database groupBy back to Record<TaskStatus, number>
    const tasksByStatus = createTaskStatusSummary();
    for (const stat of taskStatusStats) {
      tasksByStatus[stat.status] = stat._count._all;
    }

    // Map task priority stats from database groupBy back to Record<TaskPriority, number>
    const tasksByPriority = createTaskPrioritySummary();
    for (const stat of taskPriorityStats) {
      tasksByPriority[stat.priority] = stat._count._all;
    }

    // Map project health counts directly
    const projectHealth = {
      PLANNING: planningCount,
      COMPLETED: completedCount,
      AT_RISK: atRiskCount,
      ACTIVE: activeCount,
    };

    const analytics = this.buildAnalytics({
      now,
      sevenDaysAgo,
      projectHealth,
      tasksByPriority,
      reportStatusStats,
      projectMessagesLast7Days,
      recentTasks,
      recentReports,
      reviewedReports,
    });

    return {
      totalProjects,
      totalTasks,
      tasksByStatus,
      analytics,
      recentActivity: (recentMessages as any[])
        .map((message) => this.mapActivity(message))
        .sort(
          (left, right) =>
            right.timestamp.getTime() - left.timestamp.getTime(),
        )
        .slice(0, 6),
    };
  }

  private buildAnalytics(input: {
    now: Date;
    sevenDaysAgo: Date;
    projectHealth: Record<ProjectStatusView, number>;
    tasksByPriority: Record<TaskPriority, number>;
    reportStatusStats: Array<{ status: ReportStatus; _count: { _all: number } }>;
    projectMessagesLast7Days: number;
    recentTasks: Array<{ status: TaskStatus; createdAt: Date; updatedAt: Date }>;
    recentReports: Array<{ status: ReportStatus; createdAt: Date; updatedAt: Date }>;
    reviewedReports: Array<{ createdAt: Date; updatedAt: Date }>;
  }): DashboardAnalyticsView {
    const dayKeys = createTrendPoints(input.now);
    const deliveryTrendMap = new Map(
      dayKeys.map((point, index) => {
        const date = new Date(startOfDay(input.now).getTime() - (6 - index) * DAY_MS);
        return [getDayKey(date), point];
      }),
    );

    // Populate trend from recent tasks (last 7 days window)
    for (const task of input.recentTasks) {
      const createdBucket = deliveryTrendMap.get(getDayKey(task.createdAt));
      if (createdBucket) {
        createdBucket.created += 1;
      }

      if (task.status === TaskStatus.DONE) {
        const completedBucket = deliveryTrendMap.get(getDayKey(task.updatedAt));
        if (completedBucket) {
          completedBucket.completed += 1;
        }
      }
    }

    // Populate trend from recent reports (last 7 days window)
    for (const report of input.recentReports) {
      if (report.status !== ReportStatus.PENDING) {
        const reviewedBucket = deliveryTrendMap.get(getDayKey(report.updatedAt));
        if (reviewedBucket) {
          reviewedBucket.reviewed += 1;
        }
      }
    }

    // All-time report status counts mapping
    const pendingCount = input.reportStatusStats.find((s) => s.status === ReportStatus.PENDING)?._count._all ?? 0;
    const approvedCount = input.reportStatusStats.find((s) => s.status === ReportStatus.APPROVED)?._count._all ?? 0;
    const rejectedCount = input.reportStatusStats.find((s) => s.status === ReportStatus.REJECTED)?._count._all ?? 0;
    const totalReviewed = approvedCount + rejectedCount;

    const averageReviewHours =
      input.reviewedReports.length === 0
        ? null
        : Math.round(
            input.reviewedReports.reduce((total, report) => {
              return total + (report.updatedAt.getTime() - report.createdAt.getTime());
            }, 0) /
              input.reviewedReports.length /
              (60 * 60 * 1000),
          );

    return {
      projectHealth: input.projectHealth,
      tasksByPriority: input.tasksByPriority,
      deliveryTrend: dayKeys,
      momentum: {
        tasksCreatedLast7Days: input.recentTasks.filter(
          (task) => task.createdAt >= input.sevenDaysAgo,
        ).length,
        tasksCompletedLast7Days: input.recentTasks.filter(
          (task) =>
            task.status === TaskStatus.DONE && task.updatedAt >= input.sevenDaysAgo,
        ).length,
        reportsSubmittedLast7Days: input.recentReports.filter(
          (report) => report.createdAt >= input.sevenDaysAgo,
        ).length,
        projectMessagesLast7Days: input.projectMessagesLast7Days,
      },
      reviewSummary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        approvalRate:
          totalReviewed === 0
            ? 0
            : Math.round((approvedCount / totalReviewed) * 100),
        averageReviewHours,
      },
    };
  }

  private mapActivity(message: {
    id: number;
    content: string;
    createdAt: Date;
    isSystem: boolean;
    isAnnouncement: boolean;
    sender: {
      email: string;
      name: string | null;
    } | null;
    project: {
      id: number;
      name: string;
    };
  }): DashboardActivityView {
    const authorName =
      message.sender?.name ?? message.sender?.email ?? 'System';
    const prefix = message.isAnnouncement
      ? 'Announcement'
      : message.isSystem
        ? 'System update'
        : 'Project message';

    return {
      id: `project-${message.project.id}-message-${message.id}`,
      title: `${message.project.name} - ${prefix} by ${authorName}`,
      description: message.content,
      timestamp: message.createdAt,
    };
  }
}
