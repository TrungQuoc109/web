import type {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/shared/types/workspace";

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
};

export type DashboardOverview = {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  analytics: {
    projectHealth: Record<ProjectStatus, number>;
    tasksByPriority: Record<TaskPriority, number>;
    deliveryTrend: Array<{
      label: string;
      created: number;
      completed: number;
      reviewed: number;
    }>;
    momentum: {
      tasksCreatedLast7Days: number;
      tasksCompletedLast7Days: number;
      reportsSubmittedLast7Days: number;
      projectMessagesLast7Days: number;
    };
    reviewSummary: {
      pending: number;
      approved: number;
      rejected: number;
      approvalRate: number;
      averageReviewHours: number | null;
    };
  };
  recentActivity: DashboardActivity[];
};
