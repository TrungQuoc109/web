import type { Notification } from "@/notifications/types/notification";

export const notificationsMock: Notification[] = [
  {
    id: "notification-1",
    title: "You were mentioned in Project Phoenix",
    message:
      "Linh Tran mentioned you in the latest design review note for the checkout flow.",
    type: "MENTION",
    createdAt: "8 minutes ago",
    read: false,
  },
  {
    id: "notification-2",
    title: "Task assigned to you",
    message:
      "You have been assigned to 'Map onboarding edge cases' in the kanban board.",
    type: "ASSIGNED",
    createdAt: "34 minutes ago",
    read: false,
  },
  {
    id: "notification-3",
    title: "Task status changed",
    message:
      "Billing validation review moved from IN_PROGRESS to IN_REVIEW.",
    type: "STATUS_CHANGED",
    createdAt: "1 hour ago",
    read: true,
  },
  {
    id: "notification-4",
    title: "Another mention in workspace chat",
    message:
      "Quoc Duong tagged you in a message about the next sprint planning checklist.",
    type: "MENTION",
    createdAt: "Yesterday",
    read: true,
  },
];

export const emptyNotificationsMock: Notification[] = [];

