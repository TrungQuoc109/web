import { notificationsApi } from "@/notifications/api/notificationsApi";
import type { Notification } from "@/notifications/types/notification";

export const notificationsService = {
  async list(): Promise<Notification[]> {
    throw new Error(
      "Backend blocker: GET /notifications is not implemented yet."
    );
  },
  getUnreadCount: notificationsApi.getUnreadCount,
  markAsRead: notificationsApi.markAsRead,
};
