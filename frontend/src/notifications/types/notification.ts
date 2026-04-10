import type { NotificationType } from "@/shared/types/workspace";

export type { NotificationType } from "@/shared/types/workspace";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
};
