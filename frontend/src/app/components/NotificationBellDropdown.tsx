import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

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
      showErrorToast(getApiErrorMessage(error), "Notification update failed");
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
      await Promise.all(unreadIds.map((notificationId) => notificationsService.markAsRead(notificationId)));
    } catch (error) {
      updateCaches(currentNotifications);
      showErrorToast(getApiErrorMessage(error), "Bulk notification update failed");
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
        aria-label="Notifications"
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
        aria-label="Recent notifications"
        aria-hidden={!open}
        tabIndex={-1}
        className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(26rem,calc(100vw-2rem))] origin-top-right rounded-[1.5rem] border border-border bg-background/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recent workspace activity, assignments, and mentions.
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {unreadCount} unread
            </Badge>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Latest activity
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled={!canMarkAll}
              onClick={() => void handleMarkAllAsRead()}
            >
              {isMarkingAll ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
              Mark all read
            </Button>
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {notificationsQuery.isPending ? (
            <div className="flex flex-col gap-3 px-5 py-5">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-3xl border border-border bg-secondary/35"
                />
              ))}
            </div>
          ) : notificationsQuery.isError ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-medium">Notifications unavailable</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We couldn&apos;t load your recent notifications right now.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void notificationsQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                New assignments, mentions, and announcements will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
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
