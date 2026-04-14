import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { MessageBubble } from "@/messages/components/MessageBubble";
import { useProjectChat } from "@/messages/hooks/useProjectChat";
import { useSendProjectMessageMutation } from "@/messages/hooks/useSendProjectMessageMutation";
import { useAuthStore } from "@/auth/store/authStore";
import { useProjects } from "@/projects/hooks/useProjects";
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
  const chatQuery = useProjectChat(selectedProjectId || undefined);
  const sendProjectMessage = useSendProjectMessageMutation();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  const selectedProject =
    projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null;
  const messages = (chatQuery.data ?? []).map((message) => ({
    ...message,
    isCurrentUser:
      Boolean(currentUser?.id) && message.senderId === String(currentUser?.id),
  }));

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || !selectedProjectId) return;

    await sendProjectMessage.mutateAsync({
      projectId: selectedProjectId,
      content: trimmed,
    });
    setInput("");
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
        onRetry={() => void chatQuery.refetch()}
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

      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="No messages yet"
          description="Once your team starts chatting or posting announcements, messages will appear here."
        />
      ) : (
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
                  {selectedProject?.memberCount ?? 0} current members in this project room.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                <p className="text-sm font-medium">Message types</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Normal updates, system events, and announcements all live in the same thread.
                </p>
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
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1">
                  <span className="sr-only">Message</span>
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Write a message to the project room..."
                  />
                </label>

                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || sendProjectMessage.isPending}
                >
                  <Send />
                  {sendProjectMessage.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
