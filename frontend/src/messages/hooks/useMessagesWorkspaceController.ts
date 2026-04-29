import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/auth/store/authStore";
import { useMembers } from "@/members/hooks/useMembers";
import { useProjectChatCatalog } from "@/messages/hooks/useProjectChatCatalog";
import { useProjectChatPresence } from "@/messages/hooks/useProjectChatPresence";
import { useSendProjectMessageMutation } from "@/messages/hooks/useSendProjectMessageMutation";
import { useProjects } from "@/projects/hooks/useProjects";
import {
  canSendProjectAnnouncements,
  canSendProjectMessages,
  isElevatedProjectRole,
} from "@/shared/lib/workspace-permissions";

export function useMessagesWorkspaceController() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const projectsQuery = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredMemberSearch = useDeferredValue(memberSearch);
  const deferredMessageSearch = useDeferredValue(messageSearch);
  const membersQuery = useMembers(selectedProjectId || undefined);
  const members = membersQuery.data ?? [];
  const currentMember = useMemo(
    () =>
      members.find((member) => member.userId === String(currentUser?.id)) ?? null,
    [currentUser?.id, members]
  );
  const canSendMessages = membersQuery.isError
    ? false
    : canSendProjectMessages(currentMember?.role);
  const canSendAnnouncements =
    !membersQuery.isError && canSendProjectAnnouncements(currentMember?.role);
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
      elevated: members.filter((member) => isElevatedProjectRole(member.role)).length,
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
  const summary = {
    total: chatQuery.data?.total ?? 0,
    announcements: messages.filter((message) => message.type === "announcement")
      .length,
    unread: messages.filter((message) => !message.isCurrentUser).length,
  };

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

  return {
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
    page,
    setPage,
    members,
    filteredMembers,
    messages,
    summary,
    memberSummary,
    typingMembers,
    canSendMessages,
    canSendAnnouncements,
    onlineUserIds: chatPresence.onlineUserIds,
    sendMessage,
  };
}
