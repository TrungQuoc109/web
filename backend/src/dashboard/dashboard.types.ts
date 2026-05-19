import { TaskPriority, TaskStatus } from '@prisma/client';
import { ProjectStatusView } from '../project/project.types';

export interface DashboardActivityView {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
}

export interface DashboardTrendPointView {
  label: string;
  created: number;
  completed: number;
  reviewed: number;
}

export interface DashboardMomentumView {
  tasksCreatedLast7Days: number;
  tasksCompletedLast7Days: number;
  reportsSubmittedLast7Days: number;
  projectMessagesLast7Days: number;
}

export interface DashboardReportSummaryView {
  pending: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  averageReviewHours: number | null;
}

export interface DashboardAnalyticsView {
  projectHealth: Record<ProjectStatusView, number>;
  tasksByPriority: Record<TaskPriority, number>;
  deliveryTrend: DashboardTrendPointView[];
  momentum: DashboardMomentumView;
  reviewSummary: DashboardReportSummaryView;
}

export interface DashboardOverviewView {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  analytics: DashboardAnalyticsView;
  recentActivity: DashboardActivityView[];
}
