import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { useMembers } from "@/members/hooks/useMembers";
import { RoleBadge } from "@/members/components/RoleBadge";
import type { Member, MemberRole } from "@/members/types/member";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { Button } from "@/shared/ui/button";

const roleOptions: MemberRole[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "MEMBER",
  "VIEWER",
];

export function MembersPage() {
  const membersQuery = useMembers();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (membersQuery.data) {
      setMembers(membersQuery.data);
    }
  }, [membersQuery.data]);

  const summary = {
    total: members.length,
    admins: members.filter((member) =>
      ["OWNER", "ADMIN", "MANAGER"].includes(member.role)
    ).length,
    viewers: members.filter((member) => member.role === "VIEWER").length,
  };

  if (membersQuery.isPending) {
    return (
      <LoadingState
        title="Members"
        description="Loading the workspace roster and access levels."
      />
    );
  }

  if (membersQuery.isError) {
    return (
      <ErrorState
        title="Members unavailable"
        description="The mock member roster did not load correctly. Retry to restore the page."
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
            Manage who is in the workspace, what role they hold, and when they joined.
          </p>
        </div>

        <Badge variant="secondary" className="px-3 py-1">
          {summary.total} members
        </Badge>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total members</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.total}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Everyone currently included in the workspace.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Elevated roles</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.admins}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Owners, admins, and managers with broader access.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Viewers</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.viewers}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Read-focused collaborators with limited permissions.
          </p>
        </article>
      </section>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Once your workspace starts inviting people, they will appear here with roles and joined dates."
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
                          onChange={(event) =>
                            setMembers((current) =>
                              current.map((item) =>
                                item.id === member.id
                                  ? { ...item, role: event.target.value as MemberRole }
                                  : item
                              )
                            )
                          }
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">{member.joinedAt}</td>
                    <td className="px-6 py-5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setMembers((current) =>
                            current.filter((item) => item.id !== member.id)
                          )
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
