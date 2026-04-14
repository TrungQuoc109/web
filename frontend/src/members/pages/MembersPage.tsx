import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { useMembers } from "@/members/hooks/useMembers";
import { useRemoveMemberMutation } from "@/members/hooks/useRemoveMemberMutation";
import { RoleBadge } from "@/members/components/RoleBadge";
import type { MemberRole } from "@/members/types/member";
import { useProjects } from "@/projects/hooks/useProjects";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

const roleOptions: MemberRole[] = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
];

export function MembersPage() {
  const projectsQuery = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const membersQuery = useMembers(selectedProjectId || undefined);
  const removeMember = useRemoveMemberMutation();

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  const selectedProject =
    projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null;
  const members = membersQuery.data ?? [];

  const summary = {
    total: members.length,
    admins: members.filter((member) =>
      ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    ).length,
    viewers: members.filter((member) => member.role === "VIEWER").length,
  };

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
      </section>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Once teammates are added to this project, they will appear here with roles and joined dates."
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
                          <p className="font-medium text-foreground">{member.name}</p>
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
                    <td className="px-6 py-5 text-muted-foreground">{member.joinedAt}</td>
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
    </section>
  );
}
