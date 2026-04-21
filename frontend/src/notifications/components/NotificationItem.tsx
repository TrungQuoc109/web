import {
  ArrowUpRight,
  AtSign,
  BellRing,
  CheckCheck,
  ClipboardCheck,
  Megaphone,
} from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import type {
  Notification,
  NotificationType,
} from "@/notifications/types/notification";
import {
  getNotificationMeta,
  getNotificationPreview,
  getNotificationSourceLabel,
  getNotificationTitle,
} from "@/notifications/lib/notification-presenters";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/shared/ui/status-badge";

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
  const { t } = useI18n();
  const Icon = iconMap[notification.type];
  const sourceLabel = getNotificationSourceLabel(notification);
  const preview = getNotificationPreview(notification);

  return (
    <article
      className={cn(
        "rounded-[1.35rem] border px-4 py-4 transition-colors sm:px-5",
        notification.isRead
          ? "border-border/70 bg-background/80"
          : "border-border bg-secondary/25 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.45)]"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-auto min-w-0 flex-1 justify-start rounded-[1.1rem] px-0 py-0 text-left hover:bg-transparent",
            "focus-visible:ring-2 focus-visible:ring-ring"
          )}
          onClick={() => onOpen(notification)}
        >
          <div className="flex min-w-0 gap-4">
            <div
              className={cn(
                "relative mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                notification.isRead
                  ? "border-border bg-secondary/40 text-muted-foreground"
                  : "border-border bg-background text-foreground"
              )}
            >
              {!notification.isRead ? (
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-sky-500" />
              ) : null}
              <Icon className="size-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 text-sm font-semibold text-foreground">
                  {getNotificationTitle(notification)}
                </p>
                <StatusBadge
                  value={notification.type}
                  className="px-2.5 py-0.5 text-[11px]"
                />
                <Badge
                  variant={notification.isRead ? "outline" : "secondary"}
                  className={cn(
                    "px-2.5 py-0.5 text-[11px]",
                    !notification.isRead && "bg-sky-100 text-sky-900"
                  )}
                >
                  {notification.isRead ? t("common.read") : t("common.unread")}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <span>{sourceLabel}</span>
                <span className="text-border">•</span>
                <span>{getNotificationMeta(notification)}</span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {preview}
              </p>

              <p className="mt-3 text-xs font-medium text-muted-foreground">
                {formatRelativeDate(notification.createdAt)}
              </p>
            </div>
          </div>
        </Button>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:flex-col sm:items-end">
          <Button
            type="button"
            variant={notification.isRead ? "ghost" : "outline"}
            size="sm"
            className="gap-2"
            disabled={notification.isRead || isPending}
            onClick={() => {
              void onMarkAsRead(notification.id);
            }}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            {notification.isRead
              ? t("common.read")
              : isPending
                ? t("notifications.saving")
                : t("notifications.markRead")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => onOpen(notification)}
          >
            {t("common.open")}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
