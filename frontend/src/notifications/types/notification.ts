import type { NotificationType } from "@/shared/types/workspace";

export type { NotificationType } from "@/shared/types/workspace";

export type Notification = {
  id: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  activity: {
    id: string;
    content: string;
    projectId: string;
    taskId: string | null;
    isSystem: boolean;
    isAnnouncement: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
};

export type NotificationReadState = "ALL" | "READ" | "UNREAD";

export type NotificationsCatalog = {
  items: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
