import type { Notification } from "@/notifications/types/notification";

export function getNotificationTitle(notification: Notification) {
  if (notification.type === "ASSIGNED") {
    return "New Task Assignment";
  }

  if (notification.type === "STATUS_CHANGED") {
    return "Task Status Updated";
  }

  if (notification.type === "MENTION") {
    return "You Were Mentioned";
  }

  if (notification.activity.isAnnouncement) {
    return "Project Announcement";
  }

  return "Workspace Update";
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

export function getNotificationSourceLabel(notification: Notification) {
  if (notification.activity.isAnnouncement || notification.activity.isSystem) {
    return "System";
  }

  if (notification.type === "ASSIGNED") {
    return "Assignment";
  }

  if (notification.type === "MENTION") {
    return "Team Activity";
  }

  if (notification.activity.taskId) {
    return "Task Activity";
  }

  return "Project Activity";
}

export function getNotificationPreview(notification: Notification) {
  return notification.activity.content.trim();
}
