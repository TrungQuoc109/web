import type { AppLanguage } from "@/i18n/languageStore";
import { translate } from "@/i18n/messages";

export type MessagesWorkspaceCopy = {
  workspace: string;
  title: string;
  subtitle: string;

  loadingTitle: string;
  loadingDescription: string;
  unavailableTitle: string;
  unavailableDescription: string;

  noProjectsTitle: string;
  noProjectsDescription: string;

  chatUnavailableTitle: string;
  chatUnavailableDescription: string;

  activeRoom: string;
  projectChat: string;
  roomDescription: string;

  participants: string;
  loadingRoster: string;
  participantsSummary: (total: number, online: number) => string;

  postingPermissions: string;
  announcementsAllowed: string;
  messagesOnly: string;
  permissionsUnknown: string;
  viewOnly: string;

  groupMembers: string;
  groupMembersHelp: string;
  ownersAdmins: string;
  viewers: string;
  online: string;
  memberSearchPlaceholder: string;
  loadingMembers: string;
  memberListUnavailableTitle: string;
  memberListUnavailableDescription: string;
  memberListUnavailable: string;
  noMembersYet: string;
  noMembersMatchSearch: string;
  noMembers: string;
  noMemberSearchResults: string;
  retry: string;
  you: string;

  projectChatTitle: string;
  projectChatHelp: string;
  searchMessages: string;
  liveBadge: string;
  noMessagesTitle: string;
  noMessagesDescription: string;

  page: string;
  of: string;
  previous: string;
  next: string;

  messageLabel: string;
  message: string;
  writeMessage: string;
  messagePlaceholder: string;
  viewersCannotSend: string;
  announcement: string;
  announcementOnlyAdmins: string;
  viewOnlyRole: string;
  announcementOnlyOwners: string;
  currentRoleViewOnly: string;
  sendAnnouncement: string;
  send: string;
  sending: string;
  mentionsHint: string;
  typingSingular: string;
  typingPlural: string;
  mentionHelp: string;

  messages: string;
  announcements: string;
  incoming: string;
};

export function getMessagesWorkspaceCopy(language: AppLanguage): MessagesWorkspaceCopy {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(language, key, params);

  return {
    workspace: t("sidebar.workspace"),
    title: t("nav.messages"),
    subtitle: t("messages.sharedChatSubtitle"),

    loadingTitle: t("nav.messages"),
    loadingDescription: t("messages.rosterLoading"),
    unavailableTitle: t("messages.memberListUnavailableTitle"),
    unavailableDescription: t("messages.memberListUnavailableDescription"),

    noProjectsTitle: t("messages.noProjectsTitle"),
    noProjectsDescription: t("messages.noProjectsDescription"),

    chatUnavailableTitle: t("messages.chatUnavailableTitle"),
    chatUnavailableDescription: t("messages.chatUnavailableDescription"),

    activeRoom: t("messages.activeRoomLabel"),
    projectChat: t("messages.projectChatTitle"),
    roomDescription: t("messages.projectChatSubtitle"),

    participants: t("messages.participantsTitle"),
    loadingRoster: t("messages.rosterLoading"),
    participantsSummary: (total, online) =>
      t("messages.participantsSummary", { total, online }),

    postingPermissions: t("messages.postingPermissionsTitle"),
    announcementsAllowed: t("messages.postingCanAnnounce"),
    messagesOnly: t("messages.postingCanMessage"),
    permissionsUnknown: t("messages.postingUnavailable"),
    viewOnly: t("messages.viewOnlyRole"),

    groupMembers: t("messages.groupMembersTitle"),
    groupMembersHelp: t("messages.membersSubtitle"),
    ownersAdmins: t("messages.ownersAdminsLabel"),
    viewers: t("messages.viewersLabel"),
    online: t("messages.onlineLabel"),
    memberSearchPlaceholder: t("messages.memberSearchPlaceholder"),
    loadingMembers: t("messages.loadingMembers"),
    memberListUnavailableTitle: t("messages.memberListUnavailableTitle"),
    memberListUnavailableDescription: t("messages.memberListUnavailableDescription"),
    memberListUnavailable: t("messages.memberListUnavailableTitle"),
    noMembersYet: t("messages.noMembersYet"),
    noMembersMatchSearch: t("messages.noMembersMatchSearch"),
    noMembers: t("messages.noMembersYet"),
    noMemberSearchResults: t("messages.noMembersMatchSearch"),
    retry: t("common.retry"),
    you: t("messages.youLabel"),

    projectChatTitle: t("messages.projectChatTitle"),
    projectChatHelp: t("messages.projectChatSubtitle"),
    searchMessages: t("messages.messageSearchPlaceholder"),
    liveBadge: t("messages.liveApiBadge"),
    noMessagesTitle: t("messages.noMessagesTitle"),
    noMessagesDescription: t("messages.noMessagesDescription"),

    page: t("messages.page"),
    of: t("messages.of"),
    previous: t("messages.previous"),
    next: t("messages.next"),

    messageLabel: t("messages.messageLabel"),
    message: t("messages.messageLabel"),
    writeMessage: t("messages.messagePlaceholder"),
    messagePlaceholder: t("messages.messagePlaceholder"),
    viewersCannotSend: t("messages.viewersCannotSend"),
    announcement: t("messages.announcement"),
    announcementOnlyAdmins: t("messages.announcementOnlyAdmins"),
    viewOnlyRole: t("messages.viewOnlyRole"),
    announcementOnlyOwners: t("messages.announcementOnlyAdmins"),
    currentRoleViewOnly: t("messages.viewOnlyRole"),
    sendAnnouncement: t("messages.sendAnnouncement"),
    send: t("messages.send"),
    sending: t("messages.sending"),
    mentionsHint: t("messages.mentionsHint"),
    typingSingular: t("messages.typingSingular"),
    typingPlural: t("messages.typingPlural"),
    mentionHelp: t("messages.mentionsHint"),

    messages: t("messages.messagesLabel"),
    announcements: t("messages.announcementsLabel"),
    incoming: t("messages.incomingLabel"),
  };
}
