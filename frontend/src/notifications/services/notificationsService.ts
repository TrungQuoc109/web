import { notificationsApi } from "@/notifications/api/notificationsApi";
import type {
  Notification,
  NotificationsCatalog,
  NotificationReadState,
} from "@/notifications/types/notification";

type NotificationsCatalogFilters = {
  page?: number;
  pageSize?: number;
  readState?: NotificationReadState;
  type?: Notification["type"];
};

export const notificationsService = {
  list: notificationsApi.list,
  getCatalog: (filters: NotificationsCatalogFilters): Promise<NotificationsCatalog> =>
    notificationsApi.getCatalog(filters),
  getUnreadCount: notificationsApi.getUnreadCount,
  markAsRead: notificationsApi.markAsRead,
  markAllAsRead: notificationsApi.markAllAsRead,
};
