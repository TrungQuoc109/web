import { httpClient } from "@/shared/api/http-client";
import type { Notification } from "@/notifications/types/notification";

type BackendUnreadCountResponse = {
  unreadCount: number;
};

type BackendNotification = {
  id: number;
  type: Notification["type"];
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  activity: {
    id: number;
    content: string;
    projectId: number;
    taskId: number | null;
    isSystem: boolean;
    isAnnouncement: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
};

function mapNotification(notification: BackendNotification): Notification {
  return {
    id: String(notification.id),
    type: notification.type,
    createdAt: notification.createdAt,
    isRead: notification.isRead,
    readAt: notification.readAt,
    activity: {
      id: String(notification.activity.id),
      content: notification.activity.content,
      projectId: String(notification.activity.projectId),
      taskId: notification.activity.taskId
        ? String(notification.activity.taskId)
        : null,
      isSystem: notification.activity.isSystem,
      isAnnouncement: notification.activity.isAnnouncement,
      metadata: notification.activity.metadata,
      createdAt: notification.activity.createdAt,
    },
  };
}

export const notificationsApi = {
  async list(limit = 12): Promise<Notification[]> {
    const response = await httpClient.get<BackendNotification[]>("/notifications", {
      params: { limit },
    });
    return response.data.map(mapNotification);
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
