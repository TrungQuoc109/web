import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Filter,
  Loader2,
  Sparkles,
} from "lucide-react";

import { NotificationItem } from "@/notifications/components/NotificationItem";
import { useNotifications } from "@/notifications/hooks/useNotifications";
import { useNotificationsUnreadCount } from "@/notifications/hooks/useNotificationsUnreadCount";
import { getNotificationHref } from "@/notifications/lib/notification-presenters";
import { notificationsService } from "@/notifications/services/notificationsService";
import type { Notification } from "@/notifications/types/notification";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { notificationsKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

type NotificationFilter = "ALL" | "UNREAD";

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const notificationsQuery = useNotifications();
  const unreadCountQuery = useNotificationsUnreadCount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const notifications = notificationsQuery.data ?? [];
  const unreadCount =
    unreadCountQuery.data ??
    notifications.filter((notification) => !notification.isRead).length;
  const filteredNotifications =
    filter === "UNREAD"
      ? notifications.filter((notification) => !notification.isRead)
      : notifications;

  const summary = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.isRead).length,
      read: notifications.filter((notification) => notification.isRead).length,
      announcements: notifications.filter(
        (notification) => notification.activity.isAnnouncement
      ).length,
    }),
    [notifications]
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
      queryClient.getQueryData<Notification[]>(notificationsKeys.list()) ??
      notifications;
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
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.unreadCount(),
      });
    }
  }

  async function handleMarkAllAsRead() {
    const currentNotifications =
      queryClient.getQueryData<Notification[]>(notificationsKeys.list()) ??
      notifications;
    const unreadIds = currentNotifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    if (unreadIds.length === 0 || isMarkingAll) {
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
      await Promise.all(
        unreadIds.map((notificationId) =>
          notificationsService.markAsRead(notificationId)
        )
      );
    } catch (error) {
      updateCaches(currentNotifications);
      showErrorToast(getApiErrorMessage(error), "Bulk notification update failed");
    } finally {
      setPendingIds([]);
      setIsMarkingAll(false);
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.unreadCount(),
      });
    }
  }

  async function handleOpenNotification(notification: Notification) {
    if (!notification.isRead && !pendingIds.includes(notification.id)) {
      await handleMarkAsRead(notification.id);
    }

    navigate(getNotificationHref(notification));
  }

  if (notificationsQuery.isPending && !notificationsQuery.data) {
    return (
      <LoadingState
        title="Notifications"
        description="Loading your inbox, unread status, and recent workspace activity."
        bodyClassName="h-[30rem]"
      />
    );
  }

  if (notificationsQuery.isError) {
    return (
      <ErrorState
        title="Notifications unavailable"
        description="The notification inbox could not be loaded from the backend. Retry to restore your workspace feed."
        onRetry={() => {
          void notificationsQuery.refetch();
          void unreadCountQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Notifications</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Review assignments, task changes, mentions, and announcements in one
            backend-backed activity center.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={() => void handleMarkAllAsRead()}
          >
            {isMarkingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Mark all read
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {unreadCount} unread
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.total} total
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Unread</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.unread}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Notifications that still need your attention.
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Read</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.read}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Activity items already acknowledged in your inbox.
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Announcements</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.announcements}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Workspace-wide updates and important system notices.
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Inbox health</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.unread === 0 ? "Clear" : "Active"}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            A quick signal showing whether follow-up is needed right now.
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-border bg-background/95 shadow-sm">
        <div className="border-b border-border px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold">Inbox</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open a notification to jump straight to the related project,
                task, or conversation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1">
                <Button
                  type="button"
                  variant={filter === "ALL" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setFilter("ALL")}
                >
                  <Sparkles className="size-4" />
                  All
                </Button>
                <Button
                  type="button"
                  variant={filter === "UNREAD" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setFilter("UNREAD")}
                >
                  <Filter className="size-4" />
                  Unread
                </Button>
              </div>

              <Badge variant="outline" className="px-3 py-1">
                Showing {filteredNotifications.length}
              </Badge>
            </div>
          </div>
        </div>

        <div className="max-h-[40rem] overflow-y-auto">
          {notificationsQuery.isFetching && notifications.length === 0 ? (
            <div className="flex flex-col gap-3 px-5 py-5">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-3xl border border-border bg-secondary/35"
                />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Bell />}
                title={
                  filter === "UNREAD"
                    ? "No unread notifications"
                    : "No notifications yet"
                }
                description={
                  filter === "UNREAD"
                    ? "Everything in your inbox has already been acknowledged."
                    : "Assignments, mentions, and announcements will appear here as your workspace becomes active."
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
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
      </section>
    </section>
  );
}
