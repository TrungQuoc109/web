import { MessageSquare } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import { ProjectChatSidebar } from "@/messages/components/ProjectChatSidebar";
import { ProjectChatWorkspace } from "@/messages/components/ProjectChatWorkspace";
import { useMessagesWorkspaceController } from "@/messages/hooks/useMessagesWorkspaceController";
import { getMessagesWorkspaceCopy } from "@/messages/pages/messagesWorkspacePage.copy";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function MessagesWorkspacePage() {
  const { language } = useI18n();
  const ui = getMessagesWorkspaceCopy(language);
  const {
    projectsQuery,
    membersQuery,
    chatQuery,
    sendProjectMessage,
    currentUser,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    input,
    setInput,
    isAnnouncement,
    setIsAnnouncement,
    memberSearch,
    setMemberSearch,
    messageSearch,
    setMessageSearch,
    setPage,
    members,
    filteredMembers,
    messages,
    summary,
    memberSummary,
    typingMembers,
    canSendMessages,
    canSendAnnouncements,
    onlineUserIds,
    sendMessage,
  } = useMessagesWorkspaceController();

  if (projectsQuery.isPending || (selectedProjectId && chatQuery.isPending)) {
    return (
      <LoadingState
        title={ui.loadingTitle}
        description={ui.loadingDescription}
        bodyClassName="h-[34rem]"
      />
    );
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        title={ui.unavailableTitle}
        description={ui.unavailableDescription}
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  if (!projectsQuery.data?.length) {
    return (
      <EmptyState
        icon={<MessageSquare />}
        title={ui.noProjectsTitle}
        description={ui.noProjectsDescription}
      />
    );
  }

  if (chatQuery.isError) {
    return (
      <ErrorState
        title={ui.chatUnavailableTitle}
        description={ui.chatUnavailableDescription}
        onRetry={() => void chatQuery.refetch()}
      />
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {ui.workspace}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">{ui.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {ui.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <p className="text-sm text-muted-foreground">
            {summary.total} {ui.messages} / {summary.announcements}{" "}
            {ui.announcements} / {summary.unread} {ui.incoming}
          </p>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[0.34fr_1fr]">
        <ProjectChatSidebar
          ui={ui}
          projectName={selectedProject?.name}
          membersQuery={membersQuery}
          members={members}
          filteredMembers={filteredMembers}
          memberSummary={memberSummary}
          currentUserId={currentUser?.id ? String(currentUser.id) : null}
          canSendMessages={canSendMessages}
          canSendAnnouncements={canSendAnnouncements}
          onlineUserIds={onlineUserIds}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
          onRetryMembers={() => void membersQuery.refetch()}
        />

        <ProjectChatWorkspace
          ui={ui}
          messages={messages}
          typingMembers={typingMembers}
          messageSearch={messageSearch}
          onMessageSearchChange={setMessageSearch}
          page={chatQuery.data?.page ?? 1}
          totalPages={chatQuery.data?.totalPages ?? 1}
          canSendMessages={canSendMessages}
          canSendAnnouncements={canSendAnnouncements}
          input={input}
          onInputChange={setInput}
          isAnnouncement={isAnnouncement}
          onAnnouncementChange={setIsAnnouncement}
          isSending={sendProjectMessage.isPending}
          onSend={() => void sendMessage()}
          onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
          onNextPage={() =>
            setPage((current) =>
              Math.min(chatQuery.data?.totalPages ?? current, current + 1)
            )
          }
        />
      </section>
    </section>
  );
}
