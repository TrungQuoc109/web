import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Megaphone, MessageSquare, Search, Send } from "lucide-react";

import { useAuthStore } from "@/auth/store/authStore";
import { useI18n } from "@/i18n/useI18n";
import { RoleBadge } from "@/members/components/RoleBadge";
import { MessageBubble } from "@/messages/components/MessageBubble";
import { useProjectChatCatalog } from "@/messages/hooks/useProjectChatCatalog";
import { useProjectChatPresence } from "@/messages/hooks/useProjectChatPresence";
import { useSendProjectMessageMutation } from "@/messages/hooks/useSendProjectMessageMutation";
import { useMembers } from "@/members/hooks/useMembers";
import { useProjects } from "@/projects/hooks/useProjects";
import { getDisplayName } from "@/shared/lib/display";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function MessagesWorkspacePage() {
  const { language } = useI18n();
  const projectsQuery = useProjects();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [page, setPage] = useState(1);
  const ui =
    language === "vi"
      ? {
          workspace: "Không gian làm việc",
          title: "Tin nhắn",
          subtitle:
            "Kênh chat tập trung cho cập nhật dự án, sự kiện hệ thống và phối hợp nhanh giữa các thành viên.",
          loadingTitle: "Tin nhắn",
          loadingDescription:
            "Đang tải chat dự án, thông báo và thảo luận của nhóm.",
          unavailableTitle: "Không thể tải tin nhắn",
          unavailableDescription:
            "Không thể tải danh sách dự án từ backend. Hãy thử lại để khôi phục trang.",
          noProjectsTitle: "Chưa có dự án nào",
          noProjectsDescription:
            "Hãy tham gia hoặc tạo dự án trước khi mở khu chat. Backend hiện đang trả tin nhắn theo từng dự án.",
          chatUnavailableTitle: "Không thể tải chat",
          chatUnavailableDescription:
            "Không thể tải đoạn chat của dự án từ backend. Hãy thử lại để khôi phục trang.",
          messages: "tin nhắn",
          announcements: "thông báo",
          incoming: "đến",
          activeRoom: "Phòng hiện tại",
          projectChat: "Chat dự án",
          roomDescription:
            "Kênh dùng chung cho cập nhật delivery, quyết định nhanh và các thông báo toàn dự án.",
          participants: "Người tham gia",
          loadingRoster: "Đang tải danh sách thành viên của dự án...",
          participantsSummary: (total: number, online: number) =>
            `${total} thành viên hiện có trong phòng dự án này, ${online} người đang online.`,
          postingPermissions: "Quyền gửi tin",
          announcementsAllowed:
            "Bạn có thể gửi cả cập nhật thường và thông báo dự án.",
          messagesOnly:
            "Bạn có thể gửi cập nhật thường. Thông báo chỉ dành cho owner và admin.",
          permissionsUnknown:
            "Chưa thể xác minh quyền thành viên lúc này nên việc gửi tin tạm thời bị tắt.",
          viewOnly: "Vai trò hiện tại của bạn chỉ có quyền xem trong phòng dự án này.",
          groupMembers: "Thành viên nhóm",
          groupMembersHelp: "Xem ai đang thuộc nhóm chat của dự án hiện tại.",
          ownersAdmins: "owner/admin",
          viewers: "người xem",
          online: "online",
          memberSearchPlaceholder: "Tìm thành viên theo tên hoặc email",
          loadingMembers: "Đang tải danh sách thành viên dự án...",
          memberListUnavailable: "Không thể tải danh sách thành viên",
          memberListUnavailableDescription:
            "Không thể tải roster hiện tại của dự án. Hãy thử lại để khôi phục danh sách thành viên chat.",
          noMembers: "Chưa có thành viên nào trong dự án này.",
          noMemberSearchResults: "Không có thành viên nào khớp với từ khóa hiện tại.",
          you: "Bạn",
          liveBadge: "API thật",
          projectChatTitle: "Chat dự án",
          projectChatHelp:
            "Luồng thảo luận có thể cuộn với chat bubble, cập nhật hệ thống và tín hiệu đang gõ theo thời gian thực.",
          searchMessages: "Tìm tin nhắn trong dự án này",
          noMessagesTitle: "Chưa có tin nhắn",
          noMessagesDescription:
            "Hãy gửi tin đầu tiên để bắt đầu cuộc trò chuyện trong phòng dự án này.",
          page: "Trang",
          of: "trên",
          previous: "Trước",
          next: "Sau",
          message: "Tin nhắn",
          writeMessage: "Viết tin nhắn vào phòng dự án...",
          viewersCannotSend: "Người xem không thể gửi tin trong phòng dự án này.",
          announcement: "Thông báo",
          announcementOnlyOwners:
            "Thông báo chỉ dành cho owner và admin của dự án.",
          currentRoleViewOnly: "Vai trò hiện tại của bạn chỉ có quyền xem trong dự án này.",
          sending: "Đang gửi...",
          sendAnnouncement: "Gửi thông báo",
          send: "Gửi",
          typingSingular: "đang gõ...",
          typingPlural: "đang gõ...",
          mentionHelp:
            "Có hỗ trợ nhắc tên. Hãy dùng định danh như @Noah hoặc @noah.kim để thông báo cho đồng đội trong dự án.",
        }
      : {
          workspace: "Workspace",
          title: "Messages",
          subtitle:
            "A focused project chat for updates, system events, and lightweight team coordination.",
          loadingTitle: "Messages",
          loadingDescription:
            "Loading your project chat, announcements, and team discussion.",
          unavailableTitle: "Messages unavailable",
          unavailableDescription:
            "The project list could not be loaded from the backend. Retry to restore the page.",
          noProjectsTitle: "No projects yet",
          noProjectsDescription:
            "Join or create a project before opening project chat. The backend currently exposes messages by project.",
          chatUnavailableTitle: "Messages unavailable",
          chatUnavailableDescription:
            "The project chat could not be loaded from the backend. Retry to restore the page.",
          messages: "messages",
          announcements: "announcements",
          incoming: "incoming",
          activeRoom: "Active room",
          projectChat: "Project chat",
          roomDescription:
            "Shared chat for delivery updates, quick decisions, and project-wide announcements.",
          participants: "Participants",
          loadingRoster: "Loading the current project roster...",
          participantsSummary: (total: number, online: number) =>
            `${total} current members in this project room, ${online} online right now.`,
          postingPermissions: "Posting permissions",
          announcementsAllowed:
            "You can send both normal updates and project announcements.",
          messagesOnly:
            "You can send normal updates. Announcements are limited to owners and admins.",
          permissionsUnknown:
            "Member permissions could not be verified right now, so posting is temporarily disabled.",
          viewOnly: "Your current role is view-only in this project room.",
          groupMembers: "Group members",
          groupMembersHelp: "See who is currently part of this project chat.",
          ownersAdmins: "owners/admins",
          viewers: "viewers",
          online: "online",
          memberSearchPlaceholder: "Search members by name or email",
          loadingMembers: "Loading project members...",
          memberListUnavailable: "Member list unavailable",
          memberListUnavailableDescription:
            "We couldn't load the current project roster. Retry to restore the chat members list.",
          noMembers: "No members found in this project yet.",
          noMemberSearchResults: "No members match the current search.",
          you: "You",
          liveBadge: "Live API",
          projectChatTitle: "Project chat",
          projectChatHelp:
            "Scrollable workspace thread with chat bubbles, system updates, and live typing signals.",
          searchMessages: "Search messages in this project",
          noMessagesTitle: "No messages yet",
          noMessagesDescription:
            "Send the first message to open the conversation in this project room.",
          page: "Page",
          of: "of",
          previous: "Previous",
          next: "Next",
          message: "Message",
          writeMessage: "Write a message to the project room...",
          viewersCannotSend: "Viewers cannot send messages in this project room.",
          announcement: "Announcement",
          announcementOnlyOwners:
            "Announcements are available to project owners and admins.",
          currentRoleViewOnly: "Your current role is view-only in this project.",
          sending: "Sending...",
          sendAnnouncement: "Send announcement",
          send: "Send",
          typingSingular: "is typing...",
          typingPlural: "are typing...",
          mentionHelp:
            "Mentions are supported. Use handles like @Noah or @noah.kim to notify teammates in this project.",
        };
  const deferredMemberSearch = useDeferredValue(memberSearch);
  const deferredMessageSearch = useDeferredValue(messageSearch);
  const membersQuery = useMembers(selectedProjectId || undefined);
  const members = membersQuery.data ?? [];
  const currentMember = useMemo(
    () =>
      members.find((member) => member.userId === String(currentUser?.id)) ?? null,
    [currentUser?.id, members]
  );
  const canSendMessages =
    membersQuery.isError ? false : currentMember?.role !== "VIEWER";
  const canSendAnnouncements =
    !membersQuery.isError &&
    (currentMember?.role === "OWNER" || currentMember?.role === "ADMIN");
  const chatPresence = useProjectChatPresence({
    projectId: selectedProjectId || undefined,
    draftValue: input,
    enabled: Boolean(selectedProjectId) && canSendMessages,
  });
  const chatQuery = useProjectChatCatalog({
    projectId: selectedProjectId || undefined,
    search: deferredMessageSearch,
    page,
    pageSize: 30,
  });
  const sendProjectMessage = useSendProjectMessageMutation();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    setIsAnnouncement(false);
    setInput("");
    setMemberSearch("");
    setMessageSearch("");
    setPage(1);
  }, [selectedProjectId]);

  useEffect(() => {
    setPage(1);
  }, [deferredMessageSearch]);

  const selectedProject =
    projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null;
  const messages = (chatQuery.data?.items ?? []).map((message) => ({
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
      elevated: members.filter(
        (member) => member.role === "OWNER" || member.role === "ADMIN"
      ).length,
      viewers: members.filter((member) => member.role === "VIEWER").length,
      online: members.filter((member) =>
        chatPresence.onlineUserIds.includes(member.userId ?? "")
      ).length,
    }),
    [chatPresence.onlineUserIds, members]
  );
  const typingMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          chatPresence.typingUserIds.includes(member.userId ?? "") &&
          member.userId !== String(currentUser?.id)
      ),
    [chatPresence.typingUserIds, currentUser?.id, members]
  );

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || !selectedProjectId || !canSendMessages) {
      return;
    }

    await sendProjectMessage.mutateAsync({
      projectId: selectedProjectId,
      content: trimmed,
      isAnnouncement,
    });
    setInput("");
    setIsAnnouncement(false);
  }

  const summary = {
    total: chatQuery.data?.total ?? 0,
    announcements: messages.filter((message) => message.type === "announcement")
      .length,
    unread: messages.filter((message) => !message.isCurrentUser).length,
  };

  if (projectsQuery.isPending || (selectedProjectId && chatQuery.isPending)) {
    return (
      <LoadingState
        title="Messages"
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
            {ui.workspace}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">{ui.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {ui.subtitle}
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
            {summary.total} {ui.messages}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.announcements} {ui.announcements}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.unread} {ui.incoming}
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[0.34fr_1fr]">
        <aside className="rounded-[2rem] border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {ui.activeRoom}
          </p>
          <h3 className="mt-3 text-xl font-semibold">
            {selectedProject?.name ?? ui.projectChat}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {ui.roomDescription}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-sm font-medium">{ui.participants}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {membersQuery.isLoading
                  ? ui.loadingRoster
                  : ui.participantsSummary(memberSummary.total, memberSummary.online)}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-sm font-medium">{ui.postingPermissions}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {canSendAnnouncements
                  ? ui.announcementsAllowed
                  : canSendMessages
                    ? ui.messagesOnly
                    : membersQuery.isError
                      ? ui.permissionsUnknown
                      : ui.viewOnly}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{ui.groupMembers}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ui.groupMembersHelp}
                  </p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {memberSummary.total}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  {memberSummary.elevated} {ui.ownersAdmins}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {memberSummary.viewers} {ui.viewers}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {memberSummary.online} {ui.online}
                </Badge>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder={ui.memberSearchPlaceholder}
                  disabled={membersQuery.isLoading || membersQuery.isError}
                />
              </div>

              <div className="mt-4">
                {membersQuery.isLoading ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                    {ui.loadingMembers}
                  </div>
                ) : membersQuery.isError ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6">
                    <p className="text-sm font-medium text-foreground">
                      {ui.memberListUnavailable}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {ui.memberListUnavailableDescription}
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
                    {ui.noMembers}
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                    {ui.noMemberSearchResults}
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
                                  {ui.you}
                                </Badge>
                              ) : null}
                              {chatPresence.onlineUserIds.includes(member.userId ?? "") ? (
                                <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                                  {ui.online}
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold">{ui.projectChatTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ui.projectChatHelp}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full min-w-[16rem] lg:w-80">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={messageSearch}
                    onChange={(event) => setMessageSearch(event.target.value)}
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
                {ui.page} {chatQuery.data?.page ?? 1} {ui.of} {chatQuery.data?.totalPages ?? 1}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={(chatQuery.data?.page ?? 1) <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {ui.previous}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={(chatQuery.data?.page ?? 1) >= (chatQuery.data?.totalPages ?? 1)}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(chatQuery.data?.totalPages ?? current, current + 1)
                    )
                  }
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
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    canSendMessages
                      ? ui.writeMessage
                      : ui.viewersCannotSend
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
                  onClick={() => void sendMessage()}
                  disabled={
                    !canSendMessages ||
                    !input.trim() ||
                    sendProjectMessage.isPending
                  }
                >
                  <Send />
                  {sendProjectMessage.isPending
                    ? ui.sending
                    : isAnnouncement
                      ? ui.sendAnnouncement
                      : ui.send}
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
                  <p className="text-xs leading-5 text-muted-foreground">
                    {ui.mentionHelp}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

