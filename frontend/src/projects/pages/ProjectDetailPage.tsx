import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  MessageSquare,
  Users,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { ActivityList } from "@/dashboard/components/ActivityList";
import { StatCard } from "@/dashboard/components/StatCard";
import { ProjectHeader } from "@/projects/components/ProjectHeader";
import { ProjectTabs } from "@/projects/components/ProjectTabs";
import { useProjectDetail } from "@/projects/hooks/useProjectDetail";
import { getDisplayName } from "@/shared/lib/display";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { StatusBadge } from "@/shared/ui/status-badge";

const tabItems = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "members", label: "Members" },
  { id: "messages", label: "Messages" },
] as const;

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const detailQuery = useProjectDetail(projectId);

  if (detailQuery.isPending) {
    return (
      <LoadingState
        title="Project detail"
        description="Loading project summary, tabs, tasks, and recent activity."
        statCount={4}
        bodyClassName="h-[28rem]"
      />
    );
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        title="Project detail unavailable"
        description="The project detail could not be loaded from the backend. Retry to restore the page."
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  const project = detailQuery.data;
  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <section className="flex flex-col gap-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft />
        Back to projects
      </Link>

      <ProjectHeader project={project} />

      <ProjectTabs
        items={[...tabItems]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "overview" ? (
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total tasks"
              value={project.totalTasks}
              helper="All scoped tasks currently tracked for this project."
              icon={<ListTodo />}
              tone="accent"
            />
            <StatCard
              label="In progress"
              value={project.tasksByStatus.IN_PROGRESS}
              helper="Tasks actively moving toward completion."
              icon={<ListTodo />}
            />
            <StatCard
              label="Done"
              value={project.tasksByStatus.DONE}
              helper="Completed work already shipped or accepted."
              icon={<CheckCircle2 />}
            />
            <StatCard
              label="Members"
              value={project.memberCount}
              helper="Current people assigned to this project workspace."
              icon={<Users />}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <ActivityList items={project.recentActivity} />

            <div className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Task status</h3>
                <p className="text-sm text-muted-foreground">
                  Snapshot of work distribution across the project.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {Object.entries(project.tasksByStatus).map(([status, count]) => (
                  <div key={status} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge value={status as keyof typeof project.tasksByStatus} />
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-foreground/80"
                        style={{
                          width: `${project.totalTasks ? (count / project.totalTasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "tasks" ? (
        <section className="rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-lg font-semibold">Tasks</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Current project tasks with assignee and status.
            </p>
          </div>
          {project.tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<ListTodo />}
                title="No tasks in this project"
                description="Tasks added to the project will appear here with their current owner and status."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {project.tasks.map((task) => (
                <article
                  key={task.id}
                  className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Assignee: {getDisplayName(task.assignee, "Unassigned")}
                    </p>
                  </div>
                  <StatusBadge value={task.status} />
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "members" ? (
        <section className="rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-lg font-semibold">Members</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Team members participating in this project workspace.
            </p>
          </div>
          {project.members.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Users />}
                title="No members assigned"
                description="Project collaborators will appear here once teammates are added to the workspace."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {project.members.map((member) => (
                <article
                  key={member.id}
                  className="flex flex-col gap-2 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {getDisplayName(member, member.email)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "messages" ? (
        <section className="rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-lg font-semibold">Messages</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recent conversation updates for this project.
            </p>
          </div>
          {project.messages.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<MessageSquare />}
                title="No project messages yet"
                description="Conversation updates and announcements will appear here when the team starts chatting."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {project.messages.map((message) => (
                <article key={message.id} className="px-6 py-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">
                      {getDisplayName(message.author, "System")}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatRelativeDate(message.createdAt)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="rounded-2xl border border-border bg-secondary/70 p-3">
                      <MessageSquare />
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {message.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
