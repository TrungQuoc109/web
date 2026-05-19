import { notificationsApi } from "@/notifications/api/notificationsApi";

type NotificationsApiService = {
  getUnreadCount: () => Promise<number>;
  markAsRead: (notificationId: string) => Promise<void>;
};

export const notificationsApiService: NotificationsApiService = {
  getUnreadCount: notificationsApi.getUnreadCount,
  markAsRead: notificationsApi.markAsRead,
};
