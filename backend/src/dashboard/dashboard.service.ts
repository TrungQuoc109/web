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

    const [projects, tasks, reports, projectMessagesLast7Days, recentMessages] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          members: {
            ...memberScope,
          },
        },
        select: {
          id: true,
          tasks: {
            select: {
              status: true,
            },
          },
        },
      }),
      this.prisma.task.findMany({
        where: {
          project: {
            members: {
              ...memberScope,
            },
          },
        },
        select: {
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.taskReport.findMany({
        where: {
          task: {
            project: {
              members: {
                ...memberScope,
              },
            },
          },
        },
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.message.count({
        where: {
          taskId: null,
          createdAt: {
            gte: sevenDaysAgo,
          },
          project: {
            members: {
              ...memberScope,
            },
          },
        },
      }),
      this.prisma.message.findMany({
        where: {
          taskId: null,
          project: {
            members: {
              ...memberScope,
            },
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
    ]);

    const tasksByStatus = tasks.reduce<Record<TaskStatus, number>>(
      (summary, task) => {
        summary[task.status] += 1;
        return summary;
      },
      createTaskStatusSummary(),
    );

    const analytics = this.buildAnalytics({
      now,
      sevenDaysAgo,
      projects,
      tasks,
      reports,
      projectMessagesLast7Days,
    });

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      tasksByStatus,
      analytics,
      recentActivity: recentMessages
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
    projects: Array<{
      id: number;
      tasks: Array<{
        status: TaskStatus;
      }>;
    }>;
    tasks: Array<{
      status: TaskStatus;
      priority: TaskPriority;
      createdAt: Date;
      updatedAt: Date;
    }>;
    reports: Array<{
      status: ReportStatus;
      createdAt: Date;
      updatedAt: Date;
    }>;
    projectMessagesLast7Days: number;
  }): DashboardAnalyticsView {
    const dayKeys = createTrendPoints(input.now);
    const deliveryTrendMap = new Map(
      dayKeys.map((point, index) => {
        const date = new Date(startOfDay(input.now).getTime() - (6 - index) * DAY_MS);
        return [getDayKey(date), point];
      }),
    );

    const tasksByPriority = input.tasks.reduce<Record<TaskPriority, number>>(
      (summary, task) => {
        summary[task.priority] += 1;
        return summary;
      },
      createTaskPrioritySummary(),
    );

    const projectHealth = input.projects.reduce<Record<ProjectStatusView, number>>(
      (summary, project) => {
        const totalTasks = project.tasks.length;
        const completedTaskCount = project.tasks.filter(
          (task) => task.status === TaskStatus.DONE,
        ).length;
        const blockedTaskCount = project.tasks.filter(
          (task) => task.status === TaskStatus.BLOCKED,
        ).length;

        summary[
          this.deriveProjectStatus({
            totalTasks,
            completedTaskCount,
            blockedTaskCount,
          })
        ] += 1;

        return summary;
      },
      createProjectHealthSummary(),
    );

    for (const task of input.tasks) {
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

    for (const report of input.reports) {
      if (report.status !== ReportStatus.PENDING) {
        const reviewedBucket = deliveryTrendMap.get(getDayKey(report.updatedAt));
        if (reviewedBucket) {
          reviewedBucket.reviewed += 1;
        }
      }
    }

    const reviewedReports = input.reports.filter(
      (report) => report.status !== ReportStatus.PENDING,
    );
    const approvedReports = input.reports.filter(
      (report) => report.status === ReportStatus.APPROVED,
    );
    const rejectedReports = input.reports.filter(
      (report) => report.status === ReportStatus.REJECTED,
    );
    const pendingReports = input.reports.filter(
      (report) => report.status === ReportStatus.PENDING,
    );
    const averageReviewHours =
      reviewedReports.length === 0
        ? null
        : Math.round(
            reviewedReports.reduce((total, report) => {
              return total + (report.updatedAt.getTime() - report.createdAt.getTime());
            }, 0) /
              reviewedReports.length /
              (60 * 60 * 1000),
          );

    return {
      projectHealth,
      tasksByPriority,
      deliveryTrend: dayKeys,
      momentum: {
        tasksCreatedLast7Days: input.tasks.filter(
          (task) => task.createdAt >= input.sevenDaysAgo,
        ).length,
        tasksCompletedLast7Days: input.tasks.filter(
          (task) =>
            task.status === TaskStatus.DONE && task.updatedAt >= input.sevenDaysAgo,
        ).length,
        reportsSubmittedLast7Days: input.reports.filter(
          (report) => report.createdAt >= input.sevenDaysAgo,
        ).length,
        projectMessagesLast7Days: input.projectMessagesLast7Days,
      },
      reviewSummary: {
        pending: pendingReports.length,
        approved: approvedReports.length,
        rejected: rejectedReports.length,
        approvalRate:
          reviewedReports.length === 0
            ? 0
            : Math.round((approvedReports.length / reviewedReports.length) * 100),
        averageReviewHours,
      },
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
