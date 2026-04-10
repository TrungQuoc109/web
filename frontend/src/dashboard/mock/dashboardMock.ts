import type { DashboardOverview } from "@/dashboard/types/dashboard";

export const dashboardMock: DashboardOverview = {
  totalProjects: 8,
  totalTasks: 34,
  tasksByStatus: {
    TODO: 9,
    IN_PROGRESS: 11,
    IN_REVIEW: 5,
    DONE: 7,
    BLOCKED: 2,
  },
  recentActivity: [
    {
      id: "activity-1",
      title: "Landing page handoff updated",
      description: "Design review completed and implementation notes were shared.",
      timestamp: "10 minutes ago",
    },
    {
      id: "activity-2",
      title: "New sprint tasks created",
      description: "Six delivery tasks were added to the product sprint board.",
      timestamp: "45 minutes ago",
    },
    {
      id: "activity-3",
      title: "Client feedback received",
      description: "Project Phoenix moved to review after the latest stakeholder check-in.",
      timestamp: "2 hours ago",
    },
  ],
};

export const emptyDashboardMock: DashboardOverview = {
  totalProjects: 0,
  totalTasks: 0,
  tasksByStatus: {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
    BLOCKED: 0,
  },
  recentActivity: [],
};

