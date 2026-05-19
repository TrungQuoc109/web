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
  analytics: {
    projectHealth: {
      ACTIVE: 4,
      PLANNING: 1,
      AT_RISK: 2,
      COMPLETED: 1,
    },
    tasksByPriority: {
      LOW: 5,
      MEDIUM: 14,
      HIGH: 10,
      URGENT: 5,
    },
    deliveryTrend: [
      { label: "Mon", created: 2, completed: 1, reviewed: 1 },
      { label: "Tue", created: 3, completed: 2, reviewed: 1 },
      { label: "Wed", created: 1, completed: 1, reviewed: 0 },
      { label: "Thu", created: 4, completed: 2, reviewed: 2 },
      { label: "Fri", created: 2, completed: 3, reviewed: 1 },
      { label: "Sat", created: 1, completed: 1, reviewed: 1 },
      { label: "Sun", created: 2, completed: 1, reviewed: 0 },
    ],
    momentum: {
      tasksCreatedLast7Days: 15,
      tasksCompletedLast7Days: 11,
      reportsSubmittedLast7Days: 6,
      projectMessagesLast7Days: 18,
    },
    reviewSummary: {
      pending: 3,
      approved: 9,
      rejected: 2,
      approvalRate: 82,
      averageReviewHours: 16,
    },
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
  analytics: {
    projectHealth: {
      ACTIVE: 0,
      PLANNING: 0,
      AT_RISK: 0,
      COMPLETED: 0,
    },
    tasksByPriority: {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    },
    deliveryTrend: [
      { label: "Mon", created: 0, completed: 0, reviewed: 0 },
      { label: "Tue", created: 0, completed: 0, reviewed: 0 },
      { label: "Wed", created: 0, completed: 0, reviewed: 0 },
      { label: "Thu", created: 0, completed: 0, reviewed: 0 },
      { label: "Fri", created: 0, completed: 0, reviewed: 0 },
      { label: "Sat", created: 0, completed: 0, reviewed: 0 },
      { label: "Sun", created: 0, completed: 0, reviewed: 0 },
    ],
    momentum: {
      tasksCreatedLast7Days: 0,
      tasksCompletedLast7Days: 0,
      reportsSubmittedLast7Days: 0,
      projectMessagesLast7Days: 0,
    },
    reviewSummary: {
      pending: 0,
      approved: 0,
      rejected: 0,
      approvalRate: 0,
      averageReviewHours: null,
    },
  },
  recentActivity: [],
};
