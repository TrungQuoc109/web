import { httpClient } from "@/shared/api/http-client";
import type { Notification } from "@/notifications/types/notification";

type BackendUnreadCountResponse = {
  unreadCount: number;
};

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    throw new Error("Notifications API is not implemented yet.");
  },

  async getUnreadCount(): Promise<number> {
    const response = await httpClient.get<BackendUnreadCountResponse>(
      "/notifications/unread-count"
    );
    return response.data.unreadCount;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await httpClient.patch(`/notifications/${notificationId}/read`);
  },
};
