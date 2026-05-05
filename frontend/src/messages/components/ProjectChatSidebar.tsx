import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { RoleBadge } from "@/members/components/RoleBadge";
import type { Member } from "@/members/types/member";
import type { MessagesWorkspaceCopy } from "@/messages/pages/messagesWorkspacePage.copy";
import { getDisplayName } from "@/shared/lib/display";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

const infoCardClassName = "rounded-xl border border-border bg-secondary/20 p-3";
const emptyPanelClassName =
  "rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground";

type ProjectChatSidebarProps = {
  ui: MessagesWorkspaceCopy;
  projectName: string | undefined;
  membersQuery: UseQueryResult<Member[], Error>;
  members: Member[];
  filteredMembers: Member[];
  memberSummary: {
    total: number;
    elevated: number;
    viewers: number;
    online: number;
  };
  currentUserId?: string | null;
  canSendMessages: boolean;
  canSendAnnouncements: boolean;
  onlineUserIds: string[];
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
  onRetryMembers: () => void;
};

type InfoCardProps = {
  title: string;
  description: string;
};

type MemberSummaryBadgeProps = {
  value: number;
  label: string;
};

type MemberRowProps = {
  ui: MessagesWorkspaceCopy;
  member: Member;
  currentUserId?: string | null;
  onlineUserIds: string[];
};

function InfoCard({ title, description }: InfoCardProps) {
  return (
    <section className={infoCardClassName}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </section>
  );
}

function MemberSummaryStat({ value, label }: MemberSummaryBadgeProps) {
  return (
    <span className="text-xs text-muted-foreground">
      {value} {label}
    </span>
  );
}

function MemberListPlaceholder({ children }: { children: string }) {
  return <div className={emptyPanelClassName}>{children}</div>;
}

function MemberRow({
  ui,
  member,
  currentUserId,
  onlineUserIds,
}: MemberRowProps) {
  const isCurrentUser = member.userId === currentUserId;
  const isOnline = onlineUserIds.includes(member.userId ?? "");

  return (
    <article className="flex items-center gap-3 px-4 py-3">
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
          {isOnline ? (
            <span
              className="size-2 shrink-0 rounded-full bg-emerald-500"
              title={ui.online}
            />
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {member.email}
          {isCurrentUser ? ` (${ui.you})` : ""}
        </p>
      </div>
      <RoleBadge role={member.role} />
    </article>
  );
}

export function ProjectChatSidebar({
  ui,
  projectName,
  membersQuery,
  members,
  filteredMembers,
  memberSummary,
  currentUserId,
  canSendMessages,
  canSendAnnouncements,
  onlineUserIds,
  memberSearch,
  onMemberSearchChange,
  onRetryMembers,
}: ProjectChatSidebarProps) {
  const participantsDescription = membersQuery.isLoading
    ? ui.loadingRoster
    : ui.participantsSummary(memberSummary.total, memberSummary.online);
  const postingPermissionsDescription = canSendAnnouncements
    ? ui.announcementsAllowed
    : canSendMessages
      ? ui.messagesOnly
      : membersQuery.isError
        ? ui.permissionsUnknown
        : ui.viewOnly;
  const memberSummaryBadges = [
    { value: memberSummary.elevated, label: ui.ownersAdmins },
    { value: memberSummary.viewers, label: ui.viewers },
    { value: memberSummary.online, label: ui.online },
  ];

  let memberListContent: ReactNode;

  if (membersQuery.isLoading) {
    memberListContent = <MemberListPlaceholder>{ui.loadingMembers}</MemberListPlaceholder>;
  } else if (membersQuery.isError) {
    memberListContent = (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6">
        <p className="text-sm font-medium text-foreground">{ui.memberListUnavailable}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {ui.memberListUnavailableDescription}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={onRetryMembers}
        >
          {ui.retry}
        </Button>
      </div>
    );
  } else if (members.length === 0) {
    memberListContent = <MemberListPlaceholder>{ui.noMembers}</MemberListPlaceholder>;
  } else if (filteredMembers.length === 0) {
    memberListContent = (
      <MemberListPlaceholder>{ui.noMemberSearchResults}</MemberListPlaceholder>
    );
  } else {
    memberListContent = (
      <div className="max-h-[22rem] overflow-y-auto rounded-2xl border border-border bg-background">
        <div className="divide-y divide-border">
          {filteredMembers.map((member) => (
            <MemberRow
              key={member.id}
              ui={ui}
              member={member}
              currentUserId={currentUserId}
              onlineUserIds={onlineUserIds}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="rounded-2xl border border-border bg-background/95 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {ui.activeRoom}
      </p>
      <h3 className="mt-2 text-lg font-semibold">{projectName ?? ui.projectChat}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {ui.roomDescription}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <InfoCard
          title={ui.participants}
          description={participantsDescription}
        />
        <InfoCard
          title={ui.postingPermissions}
          description={postingPermissionsDescription}
        />

        <section className={infoCardClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{ui.groupMembers}</p>
              <p className="sr-only">{ui.groupMembersHelp}</p>
            </div>
            <span className="text-sm font-semibold">
              {memberSummary.total}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {memberSummaryBadges.map((badge) => (
              <MemberSummaryStat
                key={badge.label}
                value={badge.value}
                label={badge.label}
              />
            ))}
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={memberSearch}
              onChange={(event) => onMemberSearchChange(event.target.value)}
              placeholder={ui.memberSearchPlaceholder}
              disabled={membersQuery.isLoading || membersQuery.isError}
            />
          </div>

          <div className="mt-3">{memberListContent}</div>
        </section>
      </div>
    </aside>
  );
}
