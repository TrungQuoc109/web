import type { UseQueryResult } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { RoleBadge } from "@/members/components/RoleBadge";
import type { Member } from "@/members/types/member";
import type { MessagesWorkspaceCopy } from "@/messages/pages/messagesWorkspacePage.copy";
import { getDisplayName } from "@/shared/lib/display";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

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
  return (
    <aside className="rounded-[2rem] border border-border bg-background/95 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {ui.activeRoom}
      </p>
      <h3 className="mt-3 text-xl font-semibold">{projectName ?? ui.projectChat}</h3>
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
              <p className="mt-1 text-sm text-muted-foreground">{ui.groupMembersHelp}</p>
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
              onChange={(event) => onMemberSearchChange(event.target.value)}
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
                <p className="text-sm font-medium text-foreground">{ui.memberListUnavailable}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {ui.memberListUnavailableDescription}
                </p>
                <Button type="button" variant="outline" className="mt-4" onClick={onRetryMembers}>
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
                    <article key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar name={member.name} email={member.email} className="size-10 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {getDisplayName(member, member.email)}
                          </p>
                          {member.userId === currentUserId ? (
                            <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">
                              {ui.you}
                            </Badge>
                          ) : null}
                          {onlineUserIds.includes(member.userId ?? "") ? (
                            <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                              {ui.online}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
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
  );
}
