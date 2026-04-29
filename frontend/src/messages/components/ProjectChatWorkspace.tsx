import { useEffect, useRef } from "react";
import { Megaphone, MessageSquare, Search, Send } from "lucide-react";

import { MessageBubble } from "@/messages/components/MessageBubble";
import type { ChatMessage } from "@/messages/types/message";
import type { MessagesWorkspaceCopy } from "@/messages/pages/messagesWorkspacePage.copy";
import type { Member } from "@/members/types/member";
import { getDisplayName } from "@/shared/lib/display";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

type ProjectChatWorkspaceProps = {
  ui: MessagesWorkspaceCopy;
  messages: ChatMessage[];
  typingMembers: Member[];
  messageSearch: string;
  onMessageSearchChange: (value: string) => void;
  page: number;
  totalPages: number;
  canSendMessages: boolean;
  canSendAnnouncements: boolean;
  input: string;
  onInputChange: (value: string) => void;
  isAnnouncement: boolean;
  onAnnouncementChange: (value: boolean) => void;
  isSending: boolean;
  onSend: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function ProjectChatWorkspace({
  ui,
  messages,
  typingMembers,
  messageSearch,
  onMessageSearchChange,
  page,
  totalPages,
  canSendMessages,
  canSendAnnouncements,
  input,
  onInputChange,
  isAnnouncement,
  onAnnouncementChange,
  isSending,
  onSend,
  onPreviousPage,
  onNextPage,
}: ProjectChatWorkspaceProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="rounded-[2rem] border border-border bg-background/95 shadow-sm">
      <div className="border-b border-border px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold">{ui.projectChatTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{ui.projectChatHelp}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full min-w-[16rem] lg:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={messageSearch}
                onChange={(event) => onMessageSearchChange(event.target.value)}
                placeholder={ui.searchMessages}
              />
            </div>
            <Badge variant="secondary">{ui.liveBadge}</Badge>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="h-[32rem] overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare />}
            title={ui.noMessagesTitle}
            description={ui.noMessagesDescription}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {ui.page} {page} {ui.of} {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={onPreviousPage}>
              {ui.previous}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={onNextPage}
            >
              {ui.next}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="sr-only">{ui.message}</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={canSendMessages ? ui.writeMessage : ui.viewersCannotSend}
              disabled={!canSendMessages || isSending}
            />
          </label>

          <div className="flex flex-col gap-3 sm:w-56">
            {canSendAnnouncements ? (
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={isAnnouncement}
                  onChange={(event) => onAnnouncementChange(event.target.checked)}
                  disabled={isSending}
                />
                <span className="flex items-center gap-2">
                  <Megaphone className="size-4" />
                  {ui.announcement}
                </span>
              </label>
            ) : canSendMessages ? (
              <div className="rounded-2xl border border-border bg-secondary/20 px-3 py-3 text-xs text-muted-foreground">
                {ui.announcementOnlyOwners}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-secondary/20 px-3 py-3 text-xs text-muted-foreground">
                {ui.currentRoleViewOnly}
              </div>
            )}

            <Button
              type="button"
              className="gap-2"
              onClick={onSend}
              disabled={!canSendMessages || !input.trim() || isSending}
            >
              <Send />
              {isSending ? ui.sending : isAnnouncement ? ui.sendAnnouncement : ui.send}
            </Button>
            {typingMembers.length > 0 ? (
              <p className="text-xs leading-5 text-muted-foreground">
                {typingMembers
                  .map((member) => getDisplayName(member, member.email))
                  .join(", ")}{" "}
                {typingMembers.length === 1 ? ui.typingSingular : ui.typingPlural}
              </p>
            ) : null}
            {canSendMessages ? (
              <p className="text-xs leading-5 text-muted-foreground">{ui.mentionHelp}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
