import { NotificationType, Prisma } from '@prisma/client';

export interface NotificationActivityView {
  id: number;
  content: string;
  projectId: number;
  taskId: number | null;
  isSystem: boolean;
  isAnnouncement: boolean;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}

export interface NotificationView {
  id: number;
  recipientId: number;
  activityId: number;
  isRead: boolean;
  readAt: Date | null;
  type: NotificationType;
  createdAt: Date;
  activity: NotificationActivityView;
}

export interface CreateNotificationsInput {
  activityId: number;
  type: NotificationType;
  recipientIds: number[];
}
