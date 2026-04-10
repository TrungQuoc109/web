import { AtSign, BellRing, CheckCheck, ClipboardCheck } from "lucide-react";

import type {
  Notification,
  NotificationType,
} from "@/notifications/types/notification";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { StatusBadge } from "@/shared/ui/status-badge";

type NotificationItemProps = {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
};

const iconMap: Record<NotificationType, typeof AtSign> = {
  MENTION: AtSign,
  ASSIGNED: ClipboardCheck,
  STATUS_CHANGED: BellRing,
};

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const Icon = iconMap[notification.type];

  return (
    <article
      className={cn(
        "flex flex-col gap-4 px-6 py-5 transition-colors sm:flex-row sm:items-start sm:justify-between",
        !notification.read && "bg-secondary/20"
      )}
    >
      <div className="flex min-w-0 gap-4">
        <div className="rounded-2xl border border-border bg-secondary/60 p-3">
          <Icon />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {notification.title}
            </p>
            <StatusBadge value={notification.type} />
            {!notification.read ? (
              <Badge variant="outline" className="px-3 py-1">
                Unread
              </Badge>
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {notification.message}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {notification.createdAt}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <Button
          type="button"
          variant={notification.read ? "ghost" : "outline"}
          className="gap-2"
          disabled={notification.read}
          onClick={() => onMarkAsRead(notification.id)}
        >
          <CheckCheck />
          {notification.read ? "Read" : "Mark as read"}
        </Button>
      </div>
    </article>
  );
}
