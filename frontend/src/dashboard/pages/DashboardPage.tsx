import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Plus,
  Rocket,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ActivityList } from "@/dashboard/components/ActivityList";
import { DeliveryTrendCard } from "@/dashboard/components/DeliveryTrendCard";
import { ProjectSpotlight } from "@/dashboard/components/ProjectSpotlight";
import { ReviewHealthCard } from "@/dashboard/components/ReviewHealthCard";
import { StatCard } from "@/dashboard/components/StatCard";
import { TaskDistributionCard } from "@/dashboard/components/TaskDistributionCard";
import { WorkloadHealthCard } from "@/dashboard/components/WorkloadHealthCard";
import { useDashboardOverview } from "@/dashboard/hooks/useDashboardOverview";
import { CreateProjectModal } from "@/projects/components/CreateProjectModal";
import { useCreateProjectMutation } from "@/projects/hooks/useCreateProjectMutation";
import { useProjects } from "@/projects/hooks/useProjects";
import { CreateTaskModal } from "@/tasks/components/CreateTaskModal";
import { useCreateTaskMutation } from "@/tasks/hooks/useCreateTaskMutation";
import { useI18n } from "@/i18n/useI18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function DashboardPage() {
  const { t } = useI18n();
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
        title={t("dashboard.title")}
        description={t("dashboard.loading")}
        statCount={4}
        bodyClassName="h-[340px]"
      />
    );
  }

  if (overviewQuery.isError || projectsQuery.isError) {
    return (
      <ErrorState
        title={t("dashboard.unavailableTitle")}
        description={t("dashboard.unavailableDescription")}
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

  const projectHealth = overview.analytics.projectHealth;
  const completionRate =
    overview.totalTasks === 0
      ? 0
      : Math.round((overview.tasksByStatus.DONE / overview.totalTasks) * 100);
  const activeProjects = projectHealth.ACTIVE;
  const atRiskProjects = projectHealth.AT_RISK;
  const attentionCount =
    overview.tasksByStatus.BLOCKED + overview.analytics.reviewSummary.pending;
  const isEmpty =
    overview.totalProjects === 0 &&
    overview.totalTasks === 0 &&
    overview.recentActivity.length === 0;

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {t("dashboard.workspace")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">{t("dashboard.title")}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="gap-2"
            onClick={() => setIsCreateProjectOpen(true)}
          >
            <Plus />
            {t("dashboard.createProject")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setIsCreateTaskOpen(true)}
            disabled={projects.length === 0}
          >
            <Plus />
            {t("dashboard.createTask")}
          </Button>
        </div>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={<Rocket />}
          title={t("dashboard.emptyTitle")}
          description={t("dashboard.emptyDescription")}
          action={
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                type="button"
                className="gap-2"
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <Plus />
                {t("dashboard.createProject")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setIsCreateTaskOpen(true)}
                disabled={projects.length === 0}
              >
                <Plus />
                {t("dashboard.createTask")}
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("dashboard.totalProjects")}
              value={overview.totalProjects}
              helper={t("dashboard.totalProjectsHelp")}
              icon={<FolderKanban />}
              tone="accent"
            />
            <StatCard
              label={t("dashboard.activeProjects")}
              value={activeProjects}
              helper={t("dashboard.activeProjectsHelp", { count: atRiskProjects })}
              icon={<Workflow />}
            />
            <StatCard
              label={t("dashboard.completionRate")}
              value={`${completionRate}%`}
              helper={t("dashboard.completionRateHelp", {
                count: overview.analytics.momentum.tasksCompletedLast7Days,
              })}
              icon={<CheckCircle2 />}
            />
            <StatCard
              label={t("dashboard.needsAttention")}
              value={attentionCount}
              helper={t("dashboard.needsAttentionHelp", {
                blocked: overview.tasksByStatus.BLOCKED,
                pending: overview.analytics.reviewSummary.pending,
              })}
              icon={<AlertTriangle />}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("dashboard.inProgress")}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {overview.tasksByStatus.IN_PROGRESS}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dashboard.inProgressHelp")}
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("dashboard.reportsPending")}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {overview.analytics.reviewSummary.pending}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dashboard.reportsPendingHelp")}
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("dashboard.chatActivity")}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {overview.analytics.momentum.projectMessagesLast7Days}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dashboard.chatActivityHelp")}
              </p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <DeliveryTrendCard
              deliveryTrend={overview.analytics.deliveryTrend}
              momentum={overview.analytics.momentum}
            />
            <ReviewHealthCard reviewSummary={overview.analytics.reviewSummary} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <TaskDistributionCard
              totalTasks={overview.totalTasks}
              tasksByStatus={overview.tasksByStatus}
            />

            <WorkloadHealthCard
              projectHealth={overview.analytics.projectHealth}
              tasksByPriority={overview.analytics.tasksByPriority}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <ActivityList items={overview.recentActivity} />

            <div className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">{t("dashboard.quickActions")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.quickActionsHelp")}
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
                      <p className="text-base font-semibold">{t("dashboard.createProject")}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {t("dashboard.createProjectCard")}
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
                      <p className="text-base font-semibold">{t("dashboard.createTask")}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {t("dashboard.createTaskCard")}
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
                      <p className="text-base font-semibold">{t("dashboard.openProjects")}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {t("dashboard.openProjectsCard")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <FolderKanban />
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {t("dashboard.tasksTracked", { count: overview.totalTasks })}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {t("dashboard.approvalRate", {
                      count: overview.analytics.reviewSummary.approvalRate,
                    })}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {t("dashboard.teamMessages", {
                      count: overview.analytics.momentum.projectMessagesLast7Days,
                    })}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {t("dashboard.atRisk", { count: atRiskProjects })}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <ProjectSpotlight projects={projects} />

            <article className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-border bg-secondary/60 p-3">
                  <BarChart3 />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t("dashboard.executionPulse")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("dashboard.executionPulseHelp")}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-border bg-secondary/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {t("dashboard.atRiskProjects")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{atRiskProjects}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("dashboard.atRiskProjectsHelp")}
                  </p>
                </article>

                <article className="rounded-2xl border border-border bg-secondary/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {t("dashboard.avgReviewTurnaround")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.analytics.reviewSummary.averageReviewHours === null
                      ? t("common.na")
                      : `${overview.analytics.reviewSummary.averageReviewHours}h`}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("dashboard.avgReviewTurnaroundHelp")}
                  </p>
                </article>

                <article className="rounded-2xl border border-border bg-secondary/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {t("dashboard.planningProjects")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.analytics.projectHealth.PLANNING}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("dashboard.planningProjectsHelp")}
                  </p>
                </article>

                <article className="rounded-2xl border border-border bg-secondary/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {t("dashboard.reviewedReports")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.analytics.reviewSummary.approved +
                      overview.analytics.reviewSummary.rejected}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("dashboard.reviewedReportsHelp")}
                  </p>
                </article>
              </div>
            </article>
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
