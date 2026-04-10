import type { TaskStatus } from "@/shared/types/workspace";

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
  recentActivity: DashboardActivity[];
};
