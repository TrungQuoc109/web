import type { Notification } from "@/notifications/types/notification";

export const notificationsMock: Notification[] = [
  {
    id: "notification-1",
    type: "MENTION",
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    isRead: false,
    readAt: null,
    activity: {
      id: "activity-1",
      content:
        "Linh Tran mentioned you in the latest design review note for the checkout flow.",
      projectId: "project-phoenix",
      taskId: "task-12",
      isSystem: false,
      isAnnouncement: false,
      metadata: { source: "mock" },
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "notification-2",
    type: "ASSIGNED",
    createdAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    isRead: false,
    readAt: null,
    activity: {
      id: "activity-2",
      content:
        "You have been assigned to 'Map onboarding edge cases' in the kanban board.",
      projectId: "project-phoenix",
      taskId: "task-4",
      isSystem: true,
      isAnnouncement: false,
      metadata: { source: "mock" },
      createdAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "notification-3",
    type: "STATUS_CHANGED",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: true,
    readAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    activity: {
      id: "activity-3",
      content: "Billing validation review moved from IN_PROGRESS to IN_REVIEW.",
      projectId: "project-phoenix",
      taskId: "task-8",
      isSystem: true,
      isAnnouncement: false,
      metadata: { source: "mock" },
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "notification-4",
    type: "MENTION",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    readAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    activity: {
      id: "activity-4",
      content:
        "Quoc Duong tagged you in a message about the next sprint planning checklist.",
      projectId: "project-phoenix",
      taskId: null,
      isSystem: false,
      isAnnouncement: false,
      metadata: { source: "mock" },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export const emptyNotificationsMock: Notification[] = [];
