import { notificationsApi } from "@/notifications/api/notificationsApi";
import type { Notification } from "@/notifications/types/notification";

export const notificationsService = {
  list: notificationsApi.list,
  getUnreadCount: notificationsApi.getUnreadCount,
  markAsRead: notificationsApi.markAsRead,
};
