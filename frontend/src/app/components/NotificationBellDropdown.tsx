import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useI18n } from "@/i18n/useI18n";
import { NotificationItem } from "@/notifications/components/NotificationItem";
import { useNotifications } from "@/notifications/hooks/useNotifications";
import { useNotificationsUnreadCount } from "@/notifications/hooks/useNotificationsUnreadCount";
import { notificationsService } from "@/notifications/services/notificationsService";
import type { Notification } from "@/notifications/types/notification";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { notificationsKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { getNotificationHref } from "@/notifications/lib/notification-presenters";

export function NotificationBellDropdown() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationsQuery = useNotifications();
  const unreadCountQuery = useNotificationsUnreadCount();

  const notifications = notificationsQuery.data ?? [];
  const unreadCount =
    unreadCountQuery.data ??
    notifications.filter((notification) => !notification.isRead).length;
  const unreadNotifications = notifications.filter((notification) => !notification.isRead);
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  useEffect(() => {
    if (!open) {
      return;
    }

    panelRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void notificationsQuery.refetch();
    void unreadCountQuery.refetch();
  }, [open, notificationsQuery, unreadCountQuery]);

  const canMarkAll = useMemo(
    () => unreadNotifications.length > 0 && !isMarkingAll,
    [isMarkingAll, unreadNotifications.length]
  );

  function updateCaches(nextNotifications: Notification[]) {
    queryClient.setQueryData(notificationsKeys.list(), nextNotifications);
    queryClient.setQueryData(
      notificationsKeys.unreadCount(),
      nextNotifications.filter((notification) => !notification.isRead).length
    );
  }

  async function handleMarkAsRead(notificationId: string) {
    const currentNotifications =
      queryClient.getQueryData<Notification[]>(notificationsKeys.list()) ?? notifications;
    const target = currentNotifications.find(
      (notification) => notification.id === notificationId
    );

    if (!target || target.isRead) {
      return;
    }

    const nextNotifications = currentNotifications.map((notification) =>
      notification.id === notificationId
        ? {
            ...notification,
            isRead: true,
            readAt: new Date().toISOString(),
          }
        : notification
    );

    setPendingIds((current) => [...current, notificationId]);
    updateCaches(nextNotifications);

    try {
      await notificationsService.markAsRead(notificationId);
    } catch (error) {
      updateCaches(currentNotifications);
      showErrorToast(getApiErrorMessage(error), t("notifications.unavailableTitle"));
    } finally {
      setPendingIds((current) => current.filter((id) => id !== notificationId));
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
    }
  }

  async function handleMarkAllAsRead() {
    if (!canMarkAll) {
      return;
    }

    const currentNotifications =
      queryClient.getQueryData<Notification[]>(notificationsKeys.list()) ?? notifications;
    const unreadIds = currentNotifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    const nextNotifications = currentNotifications.map((notification) => ({
      ...notification,
      isRead: true,
      readAt: notification.readAt ?? new Date().toISOString(),
    }));

    setIsMarkingAll(true);
    setPendingIds(unreadIds);
    updateCaches(nextNotifications);

    try {
      await notificationsService.markAllAsRead();
    } catch (error) {
      updateCaches(currentNotifications);
      showErrorToast(getApiErrorMessage(error), t("notifications.unavailableTitle"));
    } finally {
      setPendingIds([]);
      setIsMarkingAll(false);
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
    }
  }

  async function handleOpenNotification(notification: Notification) {
    if (!notification.isRead && !pendingIds.includes(notification.id)) {
      await handleMarkAsRead(notification.id);
    }

    setOpen(false);
    navigate(getNotificationHref(notification));
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t("notifications.buttonLabel")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notification-bell-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell />
      </Button>

      {unreadCount > 0 ? (
        <Badge className="absolute -right-1 -top-1 min-w-5 justify-center px-1.5 py-0">
          {badgeLabel}
        </Badge>
      ) : null}

      <div
        id="notification-bell-panel"
        ref={panelRef}
        role="dialog"
        aria-label={t("notifications.panelLabel")}
        aria-hidden={!open}
        tabIndex={-1}
        className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(27rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-[1.65rem] border border-border bg-background/95 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.42)] backdrop-blur transition-all duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-border bg-[linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(248,250,252,0.72))] px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold">{t("notifications.title")}</p>
                <Badge variant="secondary" className="px-2.5 py-0.5 text-[11px]">
                  {t("notifications.unreadCount", { count: unreadCount })}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("notifications.subtitle")}
              </p>
            </div>
            <Button
              type="button"
              variant={canMarkAll ? "outline" : "ghost"}
              size="sm"
              className="gap-2 self-start"
              disabled={!canMarkAll}
              onClick={() => void handleMarkAllAsRead()}
            >
              {isMarkingAll ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck className="size-4" aria-hidden="true" />
              )}
              {t("notifications.markAllRead")}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <span>{t("notifications.recentActivity")}</span>
            <span className="font-medium normal-case tracking-normal">
              {t("notifications.itemsCount", { count: notifications.length })}
            </span>
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto overscroll-contain px-3 py-3">
          {notificationsQuery.isPending ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-[1.35rem] border border-border bg-secondary/30 p-4"
                />
              ))}
            </div>
          ) : notificationsQuery.isError ? (
            <div className="rounded-[1.35rem] border border-border bg-background px-5 py-8 text-center">
              <p className="text-sm font-semibold">{t("notifications.unavailableTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("notifications.unavailableDescription")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void notificationsQuery.refetch()}
              >
                {t("common.retry")}
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-[1.35rem] border border-dashed border-border bg-background px-5 py-10 text-center">
              <p className="text-sm font-semibold">{t("notifications.emptyTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("notifications.emptyDescription")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isPending={pendingIds.includes(notification.id)}
                  onMarkAsRead={handleMarkAsRead}
                  onOpen={handleOpenNotification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
