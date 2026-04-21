import type { DashboardOverview } from "@/dashboard/types/dashboard";
import { httpClient } from "@/shared/api/http-client";
import type {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/shared/types/workspace";

type BackendDashboardOverview = {
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
  recentActivity: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
};

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    const response = await httpClient.get<BackendDashboardOverview>(
      "/dashboard/overview"
    );

    return response.data;
  },
};
