import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { NotificationItem } from "@/notifications/components/NotificationItem";
import { useNotifications } from "@/notifications/hooks/useNotifications";
import type { Notification } from "@/notifications/types/notification";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data]);

  const summary = {
    total: notifications.length,
    unread: notifications.filter((item) => !item.read).length,
    mentions: notifications.filter((item) => item.type === "MENTION").length,
  };

  if (notificationsQuery.isPending) {
    return (
      <LoadingState
        title="Notifications"
        description="Loading your notification inbox and unread updates."
      />
    );
  }

  if (notificationsQuery.isError) {
    return (
      <ErrorState
        title="Notifications unavailable"
        description="The mock notifications inbox did not load correctly. Retry to restore the page."
        onRetry={() => void notificationsQuery.refetch()}
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
            A focused inbox for mentions, assignments, and status changes across your work.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {summary.total} total
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.unread} unread
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.mentions} mentions
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total notifications</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.total}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            All current notification items in the inbox.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Unread</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.unread}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Items that still need your attention.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Mentions</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.mentions}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Notifications where someone directly referenced you.
          </p>
        </article>
      </section>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="No notifications yet"
          description="Once teammates mention you, assign work, or move task statuses, updates will appear here."
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={(notificationId) =>
                  setNotifications((current) =>
                    current.map((item) =>
                      item.id === notificationId ? { ...item, read: true } : item
                    )
                  )
                }
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
