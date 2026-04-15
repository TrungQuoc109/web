import { Bell, CheckCheck, DatabaseZap } from "lucide-react";

import { useNotificationsUnreadCount } from "@/notifications/hooks/useNotificationsUnreadCount";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function NotificationsPage() {
  const unreadCountQuery = useNotificationsUnreadCount();

  if (unreadCountQuery.isPending) {
    return (
      <LoadingState
        title="Notifications"
        description="Loading your unread notification count and backend notification status."
      />
    );
  }

  if (unreadCountQuery.isError) {
    return (
      <ErrorState
        title="Notifications unavailable"
        description="The backend unread notification summary could not be loaded. Retry to restore the page."
        onRetry={() => void unreadCountQuery.refetch()}
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
            Backend-backed notification status for assignments, announcements, and task changes.
          </p>
          <p className="text-xs text-muted-foreground">
            Backend currently exposes `GET /notifications/unread-count` and `PATCH /notifications/:id/read`, but it does not expose a full `GET /notifications` inbox endpoint yet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            Server unread: {unreadCountQuery.data ?? 0}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Inbox list blocked
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Real API only
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Unread notifications</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {unreadCountQuery.data ?? 0}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Live count returned by the backend unread summary endpoint.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Supported now</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">2</p>
          <p className="mt-3 text-sm text-muted-foreground">
            `unread-count` and `mark-as-read` are available in the current backend.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Missing endpoint</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">Inbox</p>
          <p className="mt-3 text-sm text-muted-foreground">
            A list endpoint is still required before this page can render real notification items.
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <EmptyState
          icon={<Bell />}
          title="Notification inbox is waiting on the backend"
          description="This frontend no longer renders fallback notification items. Add a `GET /notifications` endpoint to return the inbox list, then wire each row to the existing mark-as-read mutation."
        />

        <section className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Backend status
              </p>
              <h3 className="mt-3 text-xl font-semibold">Current integration audit</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The notification module is partially integrated. The summary counter is live, but the inbox feed is blocked until the backend returns notification rows.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/70 p-3">
              <DatabaseZap />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <article className="rounded-2xl border border-border bg-secondary/35 p-4">
              <div className="flex items-center gap-3">
                <CheckCheck />
                <p className="font-medium">Available today</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                `GET /notifications/unread-count` is powering the server unread badge, and `PATCH /notifications/:id/read` is already available for row actions once the inbox data exists.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-secondary/35 p-4">
              <div className="flex items-center gap-3">
                <Bell />
                <p className="font-medium">Backend blocker</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Missing `GET /notifications` endpoint with item metadata such as title, body, type, read state, and activity references.
              </p>
            </article>
          </div>
        </section>
      </section>
    </section>
  );
}
