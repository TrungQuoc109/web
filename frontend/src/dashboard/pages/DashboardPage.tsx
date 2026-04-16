import {
  AlertTriangle,
  FolderKanban,
  ListTodo,
  Plus,
  Rocket,
  Target,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ActivityList } from "@/dashboard/components/ActivityList";
import { ProjectSpotlight } from "@/dashboard/components/ProjectSpotlight";
import { StatCard } from "@/dashboard/components/StatCard";
import { TaskDistributionCard } from "@/dashboard/components/TaskDistributionCard";
import { useDashboardOverview } from "@/dashboard/hooks/useDashboardOverview";
import { CreateProjectModal } from "@/projects/components/CreateProjectModal";
import { useCreateProjectMutation } from "@/projects/hooks/useCreateProjectMutation";
import { useProjects } from "@/projects/hooks/useProjects";
import { CreateTaskModal } from "@/tasks/components/CreateTaskModal";
import { useCreateTaskMutation } from "@/tasks/hooks/useCreateTaskMutation";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function DashboardPage() {
  const overviewQuery = useDashboardOverview();
  const projectsQuery = useProjects();
  const createProject = useCreateProjectMutation();
  const createTask = useCreateTaskMutation();
  const navigate = useNavigate();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  if (overviewQuery.isPending || projectsQuery.isPending) {
    return (
      <LoadingState
        title="Dashboard"
        description="Loading your overview, current task distribution, and recent team activity."
        statCount={4}
        bodyClassName="h-[340px]"
      />
    );
  }

  if (overviewQuery.isError || projectsQuery.isError) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description="The workspace overview could not be loaded from the backend. Retry to restore the dashboard cards and activity feed."
        onRetry={() => {
          void overviewQuery.refetch();
          void projectsQuery.refetch();
        }}
      />
    );
  }

  const overview = overviewQuery.data;
  const projects = projectsQuery.data ?? [];
  if (!overview) {
    return null;
  }

  const completionRate =
    overview.totalTasks === 0
      ? 0
      : Math.round((overview.tasksByStatus.DONE / overview.totalTasks) * 100);
  const activeProjects = projects.filter((project) => project.status === "ACTIVE").length;
  const atRiskProjects = projects.filter((project) => project.status === "AT_RISK").length;
  const attentionCount =
    overview.tasksByStatus.BLOCKED + overview.tasksByStatus.IN_REVIEW;
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
          <Button
            type="button"
            className="gap-2"
            onClick={() => setIsCreateProjectOpen(true)}
          >
            <Plus />
            Create project
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setIsCreateTaskOpen(true)}
            disabled={projects.length === 0}
          >
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
              <Button
                type="button"
                className="gap-2"
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <Plus />
                Create project
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setIsCreateTaskOpen(true)}
                disabled={projects.length === 0}
              >
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
              helper="All tracked initiatives currently active in the workspace."
              icon={<FolderKanban />}
              tone="accent"
            />
            <StatCard
              label="Active projects"
              value={activeProjects}
              helper={`${atRiskProjects} project${atRiskProjects === 1 ? "" : "s"} currently at risk.`}
              icon={<Workflow />}
            />
            <StatCard
              label="Completion rate"
              value={`${completionRate}%`}
              helper="Share of tasks already moved through delivery and marked done."
              icon={<Target />}
            />
            <StatCard
              label="Needs attention"
              value={attentionCount}
              helper="Blocked work and items waiting in review right now."
              icon={<AlertTriangle />}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">In progress</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {overview.tasksByStatus.IN_PROGRESS}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Tasks actively moving through delivery this moment.
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Done</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {overview.tasksByStatus.DONE}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Completed tasks already accepted or shipped.
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Blocked</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {overview.tasksByStatus.BLOCKED}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Delivery items currently waiting on unblockers.
              </p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <TaskDistributionCard
              totalTasks={overview.totalTasks}
              tasksByStatus={overview.tasksByStatus}
            />

            <ProjectSpotlight projects={projects} />
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
                  onClick={() => setIsCreateProjectOpen(true)}
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
                  onClick={() => setIsCreateTaskOpen(true)}
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

                <button
                  type="button"
                  onClick={() => navigate("/projects")}
                  className="rounded-3xl border border-border bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.92))] p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">Open projects</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Review project health, member counts, and progress in the full projects view.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <FolderKanban />
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {overview.totalTasks} tasks tracked
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {overview.tasksByStatus.IN_REVIEW} in review
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {atRiskProjects} at risk
                  </Badge>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <CreateProjectModal
        open={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        isPending={createProject.isPending}
        onCreate={async (input) => {
          await createProject.mutateAsync(input);
        }}
      />

      <CreateTaskModal
        open={isCreateTaskOpen}
        projects={projects}
        isPending={createTask.isPending}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreate={(input) => createTask.mutateAsync(input)}
      />
    </section>
  );
}
