import { useQuery } from "@tanstack/react-query";

import {
  emptyNotificationsMock,
  notificationsMock,
} from "@/notifications/mock/notificationsMock";
import type { Notification } from "@/notifications/types/notification";
import { mockDelay } from "@/shared/api/mockDelay";

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      await mockDelay(350);

      return import.meta.env.VITE_NOTIFICATIONS_EMPTY === "1"
        ? emptyNotificationsMock
        : notificationsMock;
    },
    staleTime: Infinity,
  });
}
