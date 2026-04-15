import { useQuery } from "@tanstack/react-query";

import { notificationsService } from "@/notifications/services/notificationsService";
import type { Notification } from "@/notifications/types/notification";
import { notificationsKeys } from "@/shared/lib/query-keys";

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationsService.list(),
    staleTime: 30_000,
  });
}
