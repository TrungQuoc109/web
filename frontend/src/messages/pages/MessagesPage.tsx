import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Megaphone, MessageSquare, Search, Send, Users } from "lucide-react";

import { MessageBubble } from "@/messages/components/MessageBubble";
import { useProjectChat } from "@/messages/hooks/useProjectChat";
import { useSendProjectMessageMutation } from "@/messages/hooks/useSendProjectMessageMutation";
import { useAuthStore } from "@/auth/store/authStore";
import { RoleBadge } from "@/members/components/RoleBadge";
import { useMembers } from "@/members/hooks/useMembers";
import { useProjects } from "@/projects/hooks/useProjects";
import { getDisplayName } from "@/shared/lib/display";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function MessagesPage() {
  const projectsQuery = useProjects();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const chatQuery = useProjectChat(selectedProjectId || undefined);
  const membersQuery = useMembers(selectedProjectId || undefined);
  const sendProjectMessage = useSendProjectMessageMutation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const deferredMemberSearch = useDeferredValue(memberSearch);

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    setIsAnnouncement(false);
    setMemberSearch("");
  }, [selectedProjectId]);

  const members = membersQuery.data ?? [];
  const selectedProject =
    projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null;
  const currentMember = useMemo(
    () =>
      members.find(
        (member) => member.userId === String(currentUser?.id)
      ) ?? null,
    [currentUser?.id, members]
  );
  const canSendMessages = membersQuery.isError ? false : currentMember?.role !== "VIEWER";
  const canSendAnnouncements =
    !membersQuery.isError &&
    (currentMember?.role === "OWNER" || currentMember?.role === "ADMIN");
  const messages = (chatQuery.data ?? []).map((message) => ({
    ...message,
    isCurrentUser:
      Boolean(currentUser?.id) && message.senderId === String(currentUser?.id),
  }));
  const filteredMembers = useMemo(() => {
    const normalizedSearch = deferredMemberSearch.trim().toLowerCase();

    return members.filter((member) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        (member.name ?? "").toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [deferredMemberSearch, members]);
  const memberSummary = useMemo(
    () => ({
      total: members.length,
      elevated: members.filter((member) =>
        member.role === "OWNER" || member.role === "ADMIN"
      ).length,
      viewers: members.filter((member) => member.role === "VIEWER").length,
    }),
    [members]
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || !selectedProjectId || !canSendMessages) return;

    await sendProjectMessage.mutateAsync({
      projectId: selectedProjectId,
      content: trimmed,
      isAnnouncement,
    });
    setInput("");
    setIsAnnouncement(false);
  }

  const summary = {
    total: messages.length,
    announcements: messages.filter((message) => message.type === "announcement")
      .length,
    unread: messages.filter((message) => !message.isCurrentUser).length,
  };

  if (projectsQuery.isPending || (selectedProjectId && chatQuery.isPending)) {
    return (
      <LoadingState
        title="Messages"
        description="Loading your project chat, announcements, and team discussion."
        bodyClassName="h-[34rem]"
      />
    );
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        title="Messages unavailable"
        description="The project list could not be loaded from the backend. Retry to restore the page."
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  if (!projectsQuery.data?.length) {
    return (
      <EmptyState
        icon={<MessageSquare />}
        title="No projects yet"
        description="Join or create a project before opening project chat. The backend currently exposes messages by project."
      />
    );
  }

  if (chatQuery.isError) {
    return (
      <ErrorState
        title="Messages unavailable"
        description="The project chat could not be loaded from the backend. Retry to restore the page."
        onRetry={() => {
          void chatQuery.refetch();
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
          <h2 className="text-3xl font-semibold tracking-tight">Messages</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            A focused project chat for updates, system events, and lightweight team coordination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            {projectsQuery.data.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <Badge variant="secondary" className="px-3 py-1">
            {summary.total} messages
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.announcements} announcements
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.unread} incoming
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[0.34fr_1fr]">
        <aside className="rounded-[2rem] border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Active room
          </p>
          <h3 className="mt-3 text-xl font-semibold">
            {selectedProject?.name ?? "Project chat"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Shared chat for delivery updates, quick decisions, and project-wide announcements.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-sm font-medium">Participants</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {membersQuery.isLoading
                  ? "Loading the current project roster…"
                  : `${memberSummary.total} current members in this project room.`}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-sm font-medium">Posting permissions</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {canSendAnnouncements
                  ? "You can send both normal updates and project announcements."
                  : canSendMessages
                    ? "You can send normal updates. Announcements are limited to owners and admins."
                    : membersQuery.isError
                      ? "Member permissions could not be verified right now, so posting is temporarily disabled."
                      : "Your current role is view-only in this project room."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Group members</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    See who is currently part of this project chat.
                  </p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {memberSummary.total}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  {memberSummary.elevated} owners/admins
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {memberSummary.viewers} viewers
                </Badge>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search members by name or email"
                  disabled={membersQuery.isLoading || membersQuery.isError}
                />
              </div>

              <div className="mt-4">
                {membersQuery.isLoading ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading project members…
                  </div>
                ) : membersQuery.isError ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6">
                    <p className="text-sm font-medium text-foreground">
                      Member list unavailable
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      We couldn&apos;t load the current project roster. Retry to restore the chat members list.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => void membersQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                    No members found in this project yet.
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                    No members match the current search.
                  </div>
                ) : (
                  <div className="max-h-[22rem] overflow-y-auto rounded-2xl border border-border bg-background">
                    <div className="divide-y divide-border">
                      {filteredMembers.map((member) => (
                        <article
                          key={member.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <Avatar
                            name={member.name}
                            email={member.email}
                            className="size-10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {getDisplayName(member, member.email)}
                              </p>
                              {member.userId === String(currentUser?.id) ? (
                                <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">
                                  You
                                </Badge>
                              ) : null}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                          <RoleBadge role={member.role} />
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="rounded-[2rem] border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">Project chat</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scrollable workspace thread with chat bubbles and system updates.
                </p>
              </div>
              <Badge variant="secondary">Live API</Badge>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="h-[32rem] overflow-y-auto px-5 py-5"
          >
            {messages.length === 0 ? (
              <EmptyState
                icon={<MessageSquare />}
                title="No messages yet"
                description="Send the first message to open the conversation in this project room."
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="sr-only">Message</span>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    canSendMessages
                      ? "Write a message to the project room..."
                      : "Viewers cannot send messages in this project room."
                  }
                  disabled={!canSendMessages || sendProjectMessage.isPending}
                />
              </label>

              <div className="flex flex-col gap-3 sm:w-56">
                {canSendAnnouncements ? (
                  <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-3 py-3 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={isAnnouncement}
                      onChange={(event) => setIsAnnouncement(event.target.checked)}
                      disabled={sendProjectMessage.isPending}
                    />
                    <span className="flex items-center gap-2">
                      <Megaphone className="size-4" />
                      Announcement
                    </span>
                  </label>
                ) : canSendMessages ? (
                  <div className="rounded-2xl border border-border bg-secondary/20 px-3 py-3 text-xs text-muted-foreground">
                    Announcements are available to project owners and admins.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-secondary/20 px-3 py-3 text-xs text-muted-foreground">
                    Your current role is view-only in this project.
                  </div>
                )}

                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => void sendMessage()}
                  disabled={
                    !canSendMessages ||
                    !input.trim() ||
                    sendProjectMessage.isPending
                  }
                >
                  <Send />
                  {sendProjectMessage.isPending
                    ? "Sending..."
                    : isAnnouncement
                      ? "Send announcement"
                      : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
