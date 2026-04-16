import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Copy, Link2, Plus, Search, Users } from "lucide-react";

import { useAuthStore } from "@/auth/store/authStore";
import { InviteMemberModal } from "@/invitations/components/InviteMemberModal";
import { useCreateInvitationMutation } from "@/invitations/hooks/useCreateInvitationMutation";
import { useProjectInvitations } from "@/invitations/hooks/useProjectInvitations";
import type { ProjectInvitation } from "@/invitations/types/invitation";
import { AddMemberModal } from "@/members/components/AddMemberModal";
import { useAddMemberMutation } from "@/members/hooks/useAddMemberMutation";
import { useMembers } from "@/members/hooks/useMembers";
import { useRemoveMemberMutation } from "@/members/hooks/useRemoveMemberMutation";
import { useUpdateMemberRoleMutation } from "@/members/hooks/useUpdateMemberRoleMutation";
import { RoleBadge } from "@/members/components/RoleBadge";
import type { MemberRole } from "@/members/types/member";
import { useProjects } from "@/projects/hooks/useProjects";
import { getDisplayName } from "@/shared/lib/display";
import { formatCalendarDate } from "@/shared/lib/format-date";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { useToastStore } from "@/shared/lib/toast-store";

const roleOptions: MemberRole[] = ["ADMIN", "MEMBER", "VIEWER"];
const memberFilterOptions: Array<"ALL" | MemberRole> = [
  "ALL",
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
];
const invitationStatusOptions: Array<"ALL" | ProjectInvitation["status"]> = [
  "ALL",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
];
const membersPerPage = 8;

export function MembersPage() {
  const projectsQuery = useProjects();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<"ALL" | MemberRole>("ALL");
  const [memberPage, setMemberPage] = useState(1);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteStatusFilter, setInviteStatusFilter] =
    useState<"ALL" | ProjectInvitation["status"]>("ALL");
  const deferredMemberSearch = useDeferredValue(memberSearch);
  const allMembersQuery = useMembers(selectedProjectId || undefined);
  const membersQuery = useMembers(selectedProjectId || undefined, {
    search: deferredMemberSearch.trim() || undefined,
    role: memberRoleFilter === "ALL" ? undefined : memberRoleFilter,
  });
  const invitationsQuery = useProjectInvitations(selectedProjectId || undefined);
  const addMember = useAddMemberMutation();
  const createInvitation = useCreateInvitationMutation();
  const removeMember = useRemoveMemberMutation();
  const updateMemberRole = useUpdateMemberRoleMutation();

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    setMemberPage(1);
  }, [selectedProjectId, deferredMemberSearch, memberRoleFilter]);

  const selectedProject =
    projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null;
  const allMembers = allMembersQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const currentMember =
    allMembers.find((member) => member.userId === String(currentUser?.id)) ?? null;
  const canManageMembers =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const filteredInvitations = useMemo(() => {
    const normalizedSearch = inviteSearch.trim().toLowerCase();

    return invitations.filter((invitation) => {
      const matchesSearch =
        normalizedSearch === ""
          ? true
          : invitation.email.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        inviteStatusFilter === "ALL" ? true : invitation.status === inviteStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inviteSearch, inviteStatusFilter, invitations]);
  const totalMemberPages = Math.max(1, Math.ceil(members.length / membersPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * membersPerPage;
    return members.slice(start, start + membersPerPage);
  }, [memberPage, members]);

  useEffect(() => {
    if (memberPage > totalMemberPages) {
      setMemberPage(totalMemberPages);
    }
  }, [memberPage, totalMemberPages]);

  const summary = {
    total: allMembers.length,
    admins: allMembers.filter((member) => ["OWNER", "ADMIN"].includes(member.role))
      .length,
    viewers: allMembers.filter((member) => member.role === "VIEWER").length,
    pendingInvites: invitations.filter((invitation) => invitation.status === "PENDING").length,
  };

  async function copyInviteLink(token: string) {
    const invitationUrl = `${window.location.origin}/invite/${token}`;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      useToastStore.getState().push({
        title: "Invite link copied",
        description: invitationUrl,
        variant: "success",
      });
    } catch {
      useToastStore.getState().push({
        title: "Copy failed",
        description: "Your browser blocked clipboard access for the invitation link.",
        variant: "error",
      });
    }
  }

  if (
    projectsQuery.isPending ||
    (selectedProjectId && (membersQuery.isPending || allMembersQuery.isPending))
  ) {
    return (
      <LoadingState
        title="Members"
        description="Loading the project roster and access levels."
      />
    );
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        title="Members unavailable"
        description="The project list could not be loaded from the backend. Retry to restore the page."
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  if (!projectsQuery.data?.length) {
    return (
      <EmptyState
        icon={<Users />}
        title="No projects yet"
        description="Join or create a project before managing members. The backend currently exposes members by project."
      />
    );
  }

  if (membersQuery.isError || allMembersQuery.isError) {
    return (
      <ErrorState
        title="Members unavailable"
        description="The project member roster could not be loaded from the backend. Retry to restore the page."
        onRetry={() => void membersQuery.refetch()}
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
          <h2 className="text-3xl font-semibold tracking-tight">Members</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage who is in the selected project, what role they hold, and when they joined.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            className="gap-2"
            onClick={() => setIsAddOpen(true)}
            disabled={!canManageMembers}
          >
            <Plus />
            Add member
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setIsInviteOpen(true)}
            disabled={!canManageMembers}
          >
            <Link2 />
            Invite by email
          </Button>
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
            {summary.total} members
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total members</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.total}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Everyone currently included in {selectedProject?.name ?? "this project"}.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Elevated roles</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.admins}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Owners and admins with broader access in this project.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Viewers</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.viewers}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Read-focused collaborators with limited project permissions.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending invites</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.pendingInvites}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Outstanding links waiting for invited teammates to accept access.
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Search members by name or email"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={memberRoleFilter}
              onChange={(event) =>
                setMemberRoleFilter(event.target.value as "ALL" | MemberRole)
              }
            >
              {memberFilterOptions.map((role) => (
                <option key={role} value={role}>
                  {role === "ALL" ? "All roles" : role}
                </option>
              ))}
            </select>

            <Badge variant="secondary" className="px-3 py-1">
              {members.length} visible
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Filter: {memberRoleFilter === "ALL" ? "All roles" : memberRoleFilter}
          </Badge>
          {deferredMemberSearch.trim() ? (
            <Badge variant="outline" className="px-3 py-1">
              Search: {deferredMemberSearch.trim()}
            </Badge>
          ) : null}
          <Badge variant="outline" className="px-3 py-1">
            Page {memberPage} of {totalMemberPages}
          </Badge>
        </div>
      </section>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Once teammates are added to this project, they will appear here with roles and joined dates."
          action={
            <Button
              type="button"
              className="gap-2"
              onClick={() => setIsAddOpen(true)}
              disabled={!canManageMembers}
            >
              <Plus />
              Add member
            </Button>
          }
        />
      ) : paginatedMembers.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No members match the current filters"
          description="Try another search term or switch the selected role filter to bring teammates back into view."
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} email={member.email} className="size-10" />
                        <div>
                          <p className="font-medium text-foreground">
                            {getDisplayName(member, member.email)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">{member.email}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-3">
                        <RoleBadge role={member.role} />
                        <select
                          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          value={member.role}
                          disabled={
                            !canManageMembers ||
                            member.role === "OWNER" ||
                            member.userId === String(currentUser?.id) ||
                            updateMemberRole.isPending
                          }
                          onChange={(event) => {
                            void updateMemberRole.mutateAsync({
                              projectId: selectedProjectId,
                              memberId: member.id,
                              role: event.target.value as MemberRole,
                            });
                          }}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          {member.role === "OWNER"
                            ? "Ownership transfer is not available yet, so owner role stays fixed here."
                            : member.userId === String(currentUser?.id)
                              ? "Use a dedicated self-service flow to change your own project role later."
                              : canManageMembers
                                ? "Role changes are saved directly to the backend."
                                : "Only owners and admins can manage roles in this project."}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">
                      {formatCalendarDate(member.joinedAt)}
                    </td>
                    <td className="px-6 py-5">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          !canManageMembers ||
                          member.role === "OWNER" ||
                          member.userId === String(currentUser?.id) ||
                          removeMember.isPending
                        }
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Remove ${member.email} from ${selectedProject?.name ?? "this project"}?`
                            )
                          ) {
                            return;
                          }

                          removeMember.mutate({
                            projectId: selectedProjectId,
                            memberId: member.id,
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(memberPage - 1) * membersPerPage + 1}-
              {Math.min(memberPage * membersPerPage, members.length)} of {members.length} members
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={memberPage === 1}
                onClick={() => setMemberPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={memberPage >= totalMemberPages}
                onClick={() =>
                  setMemberPage((current) => Math.min(totalMemberPages, current + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-border bg-background/95 shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h3 className="text-lg font-semibold">Invitations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Track active invite links and share them with teammates who are not yet in the project.
          </p>
        </div>

        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={inviteSearch}
                onChange={(event) => setInviteSearch(event.target.value)}
                placeholder="Search invitations by email"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={inviteStatusFilter}
                onChange={(event) =>
                  setInviteStatusFilter(
                    event.target.value as "ALL" | ProjectInvitation["status"]
                  )
                }
              >
                {invitationStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All statuses" : status}
                  </option>
                ))}
              </select>

              <Badge variant="secondary" className="px-3 py-1">
                {filteredInvitations.length} visible
              </Badge>
            </div>
          </div>
        </div>

        {invitationsQuery.isPending ? (
          <div className="px-6 py-8 text-sm text-muted-foreground">
            Loading invitations...
          </div>
        ) : invitationsQuery.isError ? (
          <div className="px-6 py-8">
            <ErrorState
              title="Invitations unavailable"
              description="The project invitation list could not be loaded from the backend."
              onRetry={() => void invitationsQuery.refetch()}
            />
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Link2 />}
              title="No invitations yet"
              description="Create an invite link to let a teammate join this project after they sign in."
              action={
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => setIsInviteOpen(true)}
                  disabled={!canManageMembers}
                >
                  <Link2 />
                  Create invitation
                </Button>
              }
            />
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Link2 />}
              title="No invitations match the current filters"
              description="Adjust the email search or invitation status filter to reveal matching invite links."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredInvitations.map((invitation) => (
              <article
                key={invitation.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{invitation.email}</p>
                    <Badge
                      variant={
                        invitation.status === "PENDING" ? "secondary" : "outline"
                      }
                      className="px-3 py-1"
                    >
                      {invitation.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Created {formatCalendarDate(invitation.createdAt)}. Expires{" "}
                    {formatCalendarDate(invitation.expiresAt)}.
                  </p>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    /invite/{invitation.token}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={invitation.status !== "PENDING"}
                    onClick={() => void copyInviteLink(invitation.token)}
                  >
                    <Copy className="size-4" />
                    Copy link
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AddMemberModal
        open={isAddOpen}
        projectName={selectedProject?.name}
        isPending={addMember.isPending}
        onClose={() => setIsAddOpen(false)}
        onAdd={(input) =>
          addMember.mutateAsync({
            projectId: selectedProjectId,
            email: input.email,
            role: input.role,
          })
        }
      />

      <InviteMemberModal
        open={isInviteOpen}
        projectName={selectedProject?.name}
        isPending={createInvitation.isPending}
        onClose={() => setIsInviteOpen(false)}
        onInvite={(input) =>
          createInvitation.mutateAsync({
            projectId: selectedProjectId,
            email: input.email,
          })
        }
      />
    </section>
  );
}
