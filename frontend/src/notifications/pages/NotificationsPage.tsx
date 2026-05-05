import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Filter, Loader2, Sparkles } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import { NotificationItem } from "@/notifications/components/NotificationItem";
import { useNotificationsCatalog } from "@/notifications/hooks/useNotificationsCatalog";
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
type NotificationTypeFilter = "ALL" | Notification["type"];

const typeFilters = [
  "ALL",
  "ASSIGNED",
  "MENTION",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "ANNOUNCEMENT",
] as const satisfies ReadonlyArray<NotificationTypeFilter>;

export function NotificationsPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>("ALL");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [page, setPage] = useState(1);

  const notificationsQuery = useNotificationsCatalog({
    page,
    pageSize: 20,
    readState: filter === "UNREAD" ? "UNREAD" : "ALL",
    type: typeFilter,
  });
  const unreadCountQuery = useNotificationsUnreadCount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const notificationsCatalog = notificationsQuery.data;
  const notifications = notificationsCatalog?.items ?? [];
  const unreadCount =
    unreadCountQuery.data ??
    notifications.filter((notification) => !notification.isRead).length;

  const summary = useMemo(
    () => ({
      matching: notificationsCatalog?.total ?? 0,
      unread: unreadCount,
      currentPage: notificationsCatalog?.page ?? 1,
      totalPages: notificationsCatalog?.totalPages ?? 1,
    }),
    [
      notificationsCatalog?.page,
      notificationsCatalog?.total,
      notificationsCatalog?.totalPages,
      unreadCount,
    ]
  );

  useEffect(() => {
    setPage(1);
  }, [filter, typeFilter]);

  function updateCaches(nextNotifications: Notification[]) {
    queryClient.setQueryData(
      notificationsKeys.catalog({
        page,
        pageSize: 20,
        readState: filter === "UNREAD" ? "UNREAD" : "ALL",
        type: typeFilter === "ALL" ? undefined : typeFilter,
      }),
      (current: typeof notificationsCatalog | undefined) =>
        current
          ? {
              ...current,
              items: nextNotifications,
            }
          : current
    );

    queryClient.setQueryData(
      notificationsKeys.unreadCount(),
      nextNotifications.filter((notification) => !notification.isRead).length
    );
  }

  async function handleMarkAsRead(notificationId: string) {
    const currentNotifications = notifications;
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
      showErrorToast(
        getApiErrorMessage(error),
        t("toast.notificationUpdateFailedTitle")
      );
    } finally {
      setPendingIds((current) => current.filter((id) => id !== notificationId));
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.unreadCount(),
      });
    }
  }

  async function handleMarkAllAsRead() {
    const currentNotifications = notifications;
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
      await notificationsService.markAllAsRead();
    } catch (error) {
      updateCaches(currentNotifications);
      showErrorToast(
        getApiErrorMessage(error),
        t("toast.notificationBulkUpdateFailedTitle")
      );
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
        title={t("notifications.title")}
        description={t("notifications.page.loading")}
        bodyClassName="h-[30rem]"
      />
    );
  }

  if (notificationsQuery.isError) {
    return (
      <ErrorState
        title={t("notifications.unavailableTitle")}
        description={t("notifications.unavailableDescription")}
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
            {t("notifications.page.workspace")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("notifications.title")}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("notifications.subtitle")}
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
            {t("notifications.markAllRead")}
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {unreadCount} {t("notifications.page.unreadShort")}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.matching} {t("notifications.page.matchingShort")}
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("notifications.page.unreadLabel")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.unread}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("notifications.page.unreadHelp")}
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("notifications.page.matchingResults")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.matching}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("notifications.page.matchingResultsHelp")}
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("notifications.page.currentPage")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.currentPage}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("notifications.page.currentPageHelp")}
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("notifications.page.totalPages")}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.totalPages}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("notifications.page.totalPagesHelp")}
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-border bg-background/95 shadow-sm">
        <div className="border-b border-border px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold">
                {t("notifications.page.inbox")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("notifications.page.inboxHelp")}
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
                  {t("notifications.page.all")}
                </Button>
                <Button
                  type="button"
                  variant={filter === "UNREAD" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setFilter("UNREAD")}
                >
                  <Filter className="size-4" />
                  {t("notifications.page.unreadLabel")}
                </Button>
              </div>

              <Badge variant="outline" className="px-3 py-1">
                {t("notifications.page.showing")} {notifications.length}
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {typeFilters.map((type) => (
              <Button
                key={type}
                type="button"
                variant={typeFilter === type ? "secondary" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type)}
              >
                {type === "ALL"
                  ? t("notifications.page.allTypes")
                  : t(`enums.statusBadge.${type}`)}
              </Button>
            ))}
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
          ) : notifications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Bell />}
                title={
                  filter === "UNREAD" || typeFilter !== "ALL"
                    ? t("notifications.page.noUnreadTitle")
                    : t("notifications.emptyTitle")
                }
                description={
                  filter === "UNREAD" || typeFilter !== "ALL"
                    ? t("notifications.page.noUnreadDescription")
                    : t("notifications.emptyDescription")
                }
              />
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

        <div className="border-t border-border px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("notifications.page.page")} {summary.currentPage}{" "}
              {t("notifications.page.of")} {summary.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={summary.currentPage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t("notifications.page.previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={summary.currentPage >= summary.totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(summary.totalPages, current + 1)
                  )
                }
              >
                {t("notifications.page.next")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

