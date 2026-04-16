import {
  AtSign,
  BellRing,
  CheckCheck,
  ClipboardCheck,
  Megaphone,
  ArrowUpRight,
} from "lucide-react";

import type {
  Notification,
  NotificationType,
} from "@/notifications/types/notification";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { StatusBadge } from "@/shared/ui/status-badge";
import {
  getNotificationMeta,
  getNotificationTitle,
} from "@/notifications/lib/notification-presenters";

type NotificationItemProps = {
  notification: Notification;
  isPending?: boolean;
  onMarkAsRead: (notificationId: string) => void | Promise<void>;
  onOpen: (notification: Notification) => void;
};

const iconMap: Record<NotificationType, typeof AtSign> = {
  MENTION: AtSign,
  ASSIGNED: ClipboardCheck,
  STATUS_CHANGED: BellRing,
  ANNOUNCEMENT: Megaphone,
};

export function NotificationItem({
  notification,
  isPending = false,
  onMarkAsRead,
  onOpen,
}: NotificationItemProps) {
  const Icon = iconMap[notification.type];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(notification);
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-4 px-5 py-4 transition-colors outline-none hover:bg-secondary/20 focus-visible:bg-secondary/20 sm:flex-row sm:items-start sm:justify-between",
        !notification.isRead && "bg-secondary/20"
      )}
    >
      <div className="flex min-w-0 gap-4">
        <div className="rounded-2xl border border-border bg-secondary/60 p-3">
          <Icon />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {getNotificationTitle(notification)}
            </p>
            <StatusBadge value={notification.type} />
            {!notification.isRead ? (
              <Badge variant="outline" className="px-3 py-1">
                Unread
              </Badge>
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {notification.activity.content}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <span>{formatRelativeDate(notification.createdAt)}</span>
            <span>&bull;</span>
            <span>{getNotificationMeta(notification)}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant={notification.isRead ? "ghost" : "outline"}
          className="gap-2"
          disabled={notification.isRead || isPending}
          onClick={(event) => {
            event.stopPropagation();
            void onMarkAsRead(notification.id);
          }}
        >
          <CheckCheck />
          {notification.isRead ? "Read" : isPending ? "Saving..." : "Mark as read"}
        </Button>

        <div className="rounded-full border border-border bg-background p-2 text-muted-foreground">
          <ArrowUpRight className="size-4" />
        </div>
      </div>
    </article>
  );
}
