import {
  FolderKanban,
  ListTodo,
  Plus,
  Rocket,
  Workflow,
} from "lucide-react";

import { ActivityList } from "@/dashboard/components/ActivityList";
import { StatCard } from "@/dashboard/components/StatCard";
import { useDashboardOverview } from "@/dashboard/hooks/useDashboardOverview";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function DashboardPage() {
  const overviewQuery = useDashboardOverview();

  if (overviewQuery.isPending) {
    return (
      <LoadingState
        title="Dashboard"
        description="Loading your overview, current task distribution, and recent team activity."
        statCount={4}
        bodyClassName="h-[340px]"
      />
    );
  }

  if (overviewQuery.isError) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description="The mock overview did not load as expected. Retry to restore the dashboard cards and activity feed."
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data;
  if (!overview) {
    return null;
  }

  const statusItems = [
    { label: "To do", value: overview.tasksByStatus.TODO },
    { label: "In progress", value: overview.tasksByStatus.IN_PROGRESS },
    { label: "In review", value: overview.tasksByStatus.IN_REVIEW },
    { label: "Done", value: overview.tasksByStatus.DONE },
    { label: "Blocked", value: overview.tasksByStatus.BLOCKED },
  ];
  const isEmpty =
    overview.totalProjects === 0 &&
    overview.totalTasks === 0 &&
    overview.recentActivity.length === 0;

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Dashboard</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            A clean operating view for project volume, task status, and recent
            team movement.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" className="gap-2">
            <Plus />
            Create project
          </Button>
          <Button type="button" variant="outline" className="gap-2">
            <Plus />
            Create task
          </Button>
        </div>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={<Rocket />}
          title="Your workspace is ready"
          description="Start by creating your first project or task. As work begins, stats and recent activity will appear automatically here."
          action={
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button type="button" className="gap-2">
                <Plus />
                Create project
              </Button>
              <Button type="button" variant="outline" className="gap-2">
                <Plus />
                Create task
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total projects"
              value={overview.totalProjects}
              helper="Active initiatives currently tracked across the workspace."
              icon={<FolderKanban />}
              tone="accent"
            />
            <StatCard
              label="Total tasks"
              value={overview.totalTasks}
              helper="All current tasks, including review and blocked work."
              icon={<ListTodo />}
            />
            <StatCard
              label="In progress"
              value={overview.tasksByStatus.IN_PROGRESS}
              helper="Work items moving actively right now."
              icon={<Workflow />}
            />
            <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">Task status</p>
                  <p className="text-3xl font-semibold tracking-tight">
                    {statusItems.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/70 p-3">
                  <Workflow />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {statusItems.map((item) => (
                  <Badge key={item.label} variant="secondary" className="px-3 py-1">
                    {item.label}: {item.value}
                  </Badge>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <ActivityList items={overview.recentActivity} />

            <div className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Quick actions</h3>
                <p className="text-sm text-muted-foreground">
                  Fast entry points for the most common project operations.
                </p>
              </div>

              <div className="mt-6 grid gap-4">
                <button
                  type="button"
                  className="rounded-3xl border border-border bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.92))] p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">Create project</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Start a new workspace with members, timelines, and milestones.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <FolderKanban />
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  className="rounded-3xl border border-border bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.92))] p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">Create task</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Add a new task, assign ownership, and move delivery forward.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <ListTodo />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
