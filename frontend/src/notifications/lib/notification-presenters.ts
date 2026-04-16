import type { Notification } from "@/notifications/types/notification";

export function getNotificationTitle(notification: Notification) {
  if (notification.type === "ASSIGNED") {
    return "Task assigned";
  }

  if (notification.type === "STATUS_CHANGED") {
    return "Task status changed";
  }

  if (notification.type === "MENTION") {
    return "Mention in workspace activity";
  }

  if (notification.activity.isAnnouncement) {
    return "Project announcement";
  }

  return "Workspace update";
}

export function getNotificationHref(notification: Notification) {
  if (notification.activity.taskId) {
    return "/tasks";
  }

  if (notification.type === "ANNOUNCEMENT") {
    return "/messages";
  }

  return `/projects/${notification.activity.projectId}`;
}

export function getNotificationMeta(notification: Notification) {
  if (notification.activity.taskId) {
    return `Task #${notification.activity.taskId}`;
  }

  return `Project #${notification.activity.projectId}`;
}
