import { useQuery } from "@tanstack/react-query";

import { notificationsService } from "@/notifications/services/notificationsService";
import { notificationsKeys } from "@/shared/lib/query-keys";

export function useNotificationsUnreadCount() {
  return useQuery<number>({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 30_000,
  });
}
