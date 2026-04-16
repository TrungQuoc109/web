import { useEffect, useState } from "react";
import { Copy, Link2, Plus, Users } from "lucide-react";

import { InviteMemberModal } from "@/invitations/components/InviteMemberModal";
import { useCreateInvitationMutation } from "@/invitations/hooks/useCreateInvitationMutation";
import { useProjectInvitations } from "@/invitations/hooks/useProjectInvitations";
import { AddMemberModal } from "@/members/components/AddMemberModal";
import { useAddMemberMutation } from "@/members/hooks/useAddMemberMutation";
import { useMembers } from "@/members/hooks/useMembers";
import { useRemoveMemberMutation } from "@/members/hooks/useRemoveMemberMutation";
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

const roleOptions: MemberRole[] = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
];

export function MembersPage() {
  const projectsQuery = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const membersQuery = useMembers(selectedProjectId || undefined);
  const invitationsQuery = useProjectInvitations(selectedProjectId || undefined);
  const addMember = useAddMemberMutation();
  const createInvitation = useCreateInvitationMutation();
  const removeMember = useRemoveMemberMutation();

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  const selectedProject =
    projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null;
  const members = membersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];

  const summary = {
    total: members.length,
    admins: members.filter((member) =>
      ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    ).length,
    viewers: members.filter((member) => member.role === "VIEWER").length,
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

  if (projectsQuery.isPending || (selectedProjectId && membersQuery.isPending)) {
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

  if (membersQuery.isError) {
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
          <Button type="button" className="gap-2" onClick={() => setIsAddOpen(true)}>
            <Plus />
            Add member
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => setIsInviteOpen(true)}>
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

      <section className="grid gap-4 md:grid-cols-3">
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

      {members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Once teammates are added to this project, they will appear here with roles and joined dates."
          action={
            <Button type="button" className="gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus />
              Add member
            </Button>
          }
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
                {members.map((member) => (
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
                          disabled
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Role updates stay disabled until the backend exposes a dedicated update endpoint.
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
                        disabled={removeMember.isPending}
                        onClick={() =>
                          removeMember.mutate({
                            projectId: selectedProjectId,
                            memberId: member.id,
                          })
                        }
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <Button type="button" className="gap-2" onClick={() => setIsInviteOpen(true)}>
                  <Link2 />
                  Create invitation
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invitations.map((invitation) => (
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
