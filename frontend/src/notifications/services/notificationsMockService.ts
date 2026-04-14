import {
  emptyNotificationsMock,
  notificationsMock,
} from "@/notifications/mock/notificationsMock";
import type { Notification } from "@/notifications/types/notification";
import { mockDelay } from "@/shared/api/mockDelay";

export const notificationsMockService = {
  async list(): Promise<Notification[]> {
    await mockDelay(350);

    return import.meta.env.VITE_NOTIFICATIONS_EMPTY === "1"
      ? emptyNotificationsMock
      : notificationsMock;
  },
};
