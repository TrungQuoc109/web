import { useQuery } from "@tanstack/react-query";

import { notificationsApiService } from "@/notifications/services/notificationsApiService";

export function useNotificationsUnreadCount() {
  return useQuery<number>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApiService.getUnreadCount(),
    staleTime: 30_000,
  });
}
