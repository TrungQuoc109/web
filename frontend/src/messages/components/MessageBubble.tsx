import { Megaphone } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";
import { getDisplayName } from "@/shared/lib/display";
import { formatRelativeDate } from "@/shared/lib/format-date";
import type { ChatMessage } from "@/messages/types/message";

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const { language } = useI18n();
  const ui =
    language === "vi"
      ? {
          unknownSender: "Người gửi không xác định",
          announcement: "Thông báo",
        }
      : {
          unknownSender: "Unknown sender",
          announcement: "Announcement",
        };

  if (message.type === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const isAnnouncement = message.type === "announcement";

  return (
    <article
      className={cn(
        "flex gap-3",
        message.isCurrentUser && "justify-end"
      )}
    >
      {!message.isCurrentUser ? (
        <Avatar
          name={message.author?.name}
          email={message.author?.email}
          className="size-10 shrink-0"
        />
      ) : null}

      <div
        className={cn(
          "max-w-[min(42rem,85vw)] rounded-2xl border border-border px-4 py-3 shadow-sm",
          message.isCurrentUser
            ? "bg-primary text-primary-foreground"
            : "bg-background",
          isAnnouncement &&
            !message.isCurrentUser &&
            "bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.95))]"
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {message.author ? (
            <p
              className={cn(
                "text-sm font-semibold",
                message.isCurrentUser
                  ? "text-primary-foreground"
                  : "text-foreground"
              )}
            >
              {getDisplayName(message.author, ui.unknownSender)}
            </p>
          ) : null}

          {isAnnouncement ? (
            <Badge
              className={cn(
                "gap-1 px-2 py-0.5",
                message.isCurrentUser
                  ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              <Megaphone className="size-3.5" />
              {ui.announcement}
            </Badge>
          ) : null}

          <time
            dateTime={message.createdAt}
            title={`${message.type} - ${message.createdAt}`}
            className={cn(
              "text-xs",
              message.isCurrentUser
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            )}
          >
            {formatRelativeDate(message.createdAt)}
          </time>
        </div>

        <p
          className={cn(
            "mt-2 text-sm leading-6",
            message.isCurrentUser
              ? "text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          {message.content}
        </p>
      </div>

      {message.isCurrentUser ? (
        <Avatar
          name={message.author?.name}
          email={message.author?.email}
          className="size-10 shrink-0 border-primary/20 bg-primary/10 text-foreground"
        />
      ) : null}
    </article>
  );
}
