import { useQuery } from "@tanstack/react-query";

import { notificationsService } from "@/notifications/services/notificationsService";
import type {
  Notification,
  NotificationsCatalog,
  NotificationReadState,
} from "@/notifications/types/notification";
import { notificationsKeys } from "@/shared/lib/query-keys";

type UseNotificationsCatalogInput = {
  page: number;
  pageSize?: number;
  readState?: NotificationReadState;
  type?: Notification["type"] | "ALL";
};

export function useNotificationsCatalog(input: UseNotificationsCatalogInput) {
  const filters = {
    page: input.page,
    pageSize: input.pageSize ?? 20,
    readState: input.readState ?? "ALL",
    type: input.type === "ALL" ? undefined : input.type,
  };

  return useQuery<NotificationsCatalog>({
    queryKey: notificationsKeys.catalog(filters),
    queryFn: () => notificationsService.getCatalog(filters),
    staleTime: 30_000,
  });
}
