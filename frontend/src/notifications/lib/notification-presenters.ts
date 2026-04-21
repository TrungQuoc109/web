import type { Notification } from "@/notifications/types/notification";
import { getCurrentTranslation } from "@/i18n/useI18n";

export function getNotificationTitle(notification: Notification) {
  if (notification.type === "ASSIGNED") {
    return getCurrentTranslation("notifications.newTaskAssignment");
  }

  if (notification.type === "STATUS_CHANGED") {
    return getCurrentTranslation("notifications.taskStatusUpdated");
  }

  if (notification.type === "MENTION") {
    return getCurrentTranslation("notifications.mentioned");
  }

  if (notification.activity.isAnnouncement) {
    return getCurrentTranslation("notifications.projectAnnouncement");
  }

  return getCurrentTranslation("notifications.workspaceUpdate");
}

export function getNotificationHref(notification: Notification) {
  if (notification.activity.taskId) {
    return "/tasks";
  }

  if (
    notification.type === "ANNOUNCEMENT" ||
    notification.type === "MENTION"
  ) {
    return "/messages";
  }

  return `/projects/${notification.activity.projectId}`;
}

export function getNotificationMeta(notification: Notification) {
  if (notification.activity.taskId) {
    return getCurrentTranslation("notifications.taskMeta", {
      id: notification.activity.taskId,
    });
  }

  return getCurrentTranslation("notifications.projectMeta", {
    id: notification.activity.projectId,
  });
}

export function getNotificationSourceLabel(notification: Notification) {
  if (notification.activity.isAnnouncement || notification.activity.isSystem) {
    return getCurrentTranslation("notifications.system");
  }

  if (notification.type === "ASSIGNED") {
    return getCurrentTranslation("notifications.assignment");
  }

  if (notification.type === "MENTION") {
    return getCurrentTranslation("notifications.teamActivity");
  }

  if (notification.activity.taskId) {
    return getCurrentTranslation("notifications.taskActivity");
  }

  return getCurrentTranslation("notifications.projectActivity");
}

export function getNotificationPreview(notification: Notification) {
  return notification.activity.content.trim();
}
