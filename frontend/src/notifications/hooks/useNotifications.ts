import { useQuery } from "@tanstack/react-query";

import { notificationsService } from "@/notifications/services/notificationsService";
import type { Notification } from "@/notifications/types/notification";

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list(),
    staleTime: Infinity,
  });
}
