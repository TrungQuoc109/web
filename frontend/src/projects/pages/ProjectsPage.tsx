import { useDeferredValue, useEffect, useState } from "react";
import { FolderKanban, LayoutGrid, List, Plus, Search } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import { CreateProjectModal } from "@/projects/components/CreateProjectModal";
import { ProjectList } from "@/projects/components/ProjectList";
import { useCreateProjectMutation } from "@/projects/hooks/useCreateProjectMutation";
import { useProjects } from "@/projects/hooks/useProjects";
import { useProjectsCatalog } from "@/projects/hooks/useProjectsCatalog";
import type { ProjectStatusFilter } from "@/projects/types/project";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import {
  FilterDropdownChip,
  type FilterDropdownOption,
} from "@/shared/ui/filter-dropdown-chip";
import { LoadingState } from "@/shared/ui/loading-state";

export function ProjectsPage() {
  const { language, t } = useI18n();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);

  const projectsSummaryQuery = useProjects();
  const projectsQuery = useProjectsCatalog({
    page,
    pageSize: 12,
    search: deferredSearch,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });
  const createProject = useCreateProjectMutation();

  const projects = projectsSummaryQuery.data ?? [];
  const catalog = projectsQuery.data;
  const filteredProjects = catalog?.items ?? [];
  const resetLabel = language === "vi" ? "Đặt lại" : "Reset";
  const statusFilterOptions: FilterDropdownOption[] = [
    { value: "ALL", label: t("projects.page.allStatuses") },
    { value: "ACTIVE", label: t("enums.statusBadge.ACTIVE") },
    { value: "PLANNING", label: t("enums.statusBadge.PLANNING") },
    { value: "AT_RISK", label: t("enums.statusBadge.AT_RISK") },
    { value: "COMPLETED", label: t("enums.statusBadge.COMPLETED") },
  ];
  const statusFilterLabel =
    statusFilter === "ALL"
      ? t("projects.page.allStatuses")
      : t(`enums.statusBadge.${statusFilter}`);
  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "ALL";

  const statusCounts = {
    all: projects.length,
    active: projects.filter((project) => project.status === "ACTIVE").length,
    atRisk: projects.filter((project) => project.status === "AT_RISK").length,
  };

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, view]);

  if (projectsSummaryQuery.isPending || projectsQuery.isPending) {
    return (
      <LoadingState
        title={t("nav.projects")}
        description={t("projects.page.loading")}
        bodyClassName="h-[24rem]"
      />
    );
  }

  if (projectsSummaryQuery.isError || projectsQuery.isError) {
    return (
      <ErrorState
        title={t("projects.page.unavailableTitle")}
        description={t("projects.page.unavailableDescription")}
        onRetry={() => {
          void projectsSummaryQuery.refetch();
          void projectsQuery.refetch();
        }}
      />
    );
  }

  return (
    <>
      <section className="flex flex-col gap-8">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t("projects.page.workspace")}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("nav.projects")}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("projects.page.subtitle")}
            </p>
          </div>

          <Button
            type="button"
            className="gap-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus />
            {t("projects.page.createProject")}
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {t("projects.page.stats.allProjects")}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.all}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("projects.page.stats.allProjectsHelp")}
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {t("projects.page.stats.activeDelivery")}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.active}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("projects.page.stats.activeDeliveryHelp")}
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {t("projects.page.stats.atRisk")}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.atRisk}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("projects.page.stats.atRiskHelp")}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("projects.page.search")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <FilterDropdownChip
                label={t("projects.page.filter")}
                value={statusFilter}
                currentLabel={statusFilterLabel}
                options={statusFilterOptions}
                onChange={(value) => setStatusFilter(value as ProjectStatusFilter)}
                active={statusFilter !== "ALL"}
              />
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1">
                <Button
                  type="button"
                  variant={view === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setView("cards")}
                >
                  <LayoutGrid />
                  {t("projects.page.view.cards")}
                </Button>
                <Button
                  type="button"
                  variant={view === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setView("table")}
                >
                  <List />
                  {t("projects.page.view.table")}
                </Button>
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                >
                  {resetLabel}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {catalog?.total ?? filteredProjects.length}{" "}
              {t("projects.page.visible")}
            </Badge>
            <Badge variant="outline" className="gap-2 px-3 py-1">
              {view === "cards" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              {view === "cards" ? t("projects.page.view.cards") : t("projects.page.view.table")}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {t("projects.page.page")} {catalog?.page ?? page} {t("projects.page.of")}{" "}
              {catalog?.totalPages ?? 1}
            </p>
          </div>
        </section>

        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title={t("projects.page.noProjectsTitle")}
            description={t("projects.page.noProjectsDescription")}
            action={
              <Button
                type="button"
                className="gap-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus />
                {t("projects.page.createProject")}
              </Button>
            }
          />
        ) : (
          <>
            <ProjectList projects={filteredProjects} view={view} />

            {filteredProjects.length > 0 ? (
              <section className="flex flex-col gap-3 rounded-3xl border border-border bg-background/95 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("projects.page.showing")}{" "}
                  {Math.min(
                    ((catalog?.page ?? page) - 1) *
                      (catalog?.pageSize ?? filteredProjects.length) +
                      1,
                    catalog?.total ?? filteredProjects.length
                  )}
                  -
                  {Math.min(
                    (catalog?.page ?? page) *
                      (catalog?.pageSize ?? filteredProjects.length),
                    catalog?.total ?? filteredProjects.length
                  )}{" "}
                  {t("projects.page.of")} {catalog?.total ?? filteredProjects.length}{" "}
                  {t("nav.projects").toLowerCase()}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(catalog?.page ?? page) <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    {t("projects.page.previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(catalog?.page ?? page) >= (catalog?.totalPages ?? 1)}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(catalog?.totalPages ?? current, current + 1)
                      )
                    }
                  >
                    {t("projects.page.next")}
                  </Button>
                </div>
              </section>
            ) : null}
          </>
        )}
      </section>

      <CreateProjectModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        isPending={createProject.isPending}
        onCreate={async (input) => {
          await createProject.mutateAsync(input);
          setView("cards");
        }}
      />
    </>
  );
}
