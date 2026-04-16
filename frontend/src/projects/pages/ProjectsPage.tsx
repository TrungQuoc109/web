import { useDeferredValue, useEffect, useState } from "react";
import {
  FolderKanban,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";

import { CreateProjectModal } from "@/projects/components/CreateProjectModal";
import { ProjectList } from "@/projects/components/ProjectList";
import { useProjectsCatalog } from "@/projects/hooks/useProjectsCatalog";
import { useCreateProjectMutation } from "@/projects/hooks/useCreateProjectMutation";
import { useProjects } from "@/projects/hooks/useProjects";
import type { ProjectStatusFilter } from "@/projects/types/project";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function ProjectsPage() {
  const projectsSummaryQuery = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const projectsQuery = useProjectsCatalog({
    search: deferredSearch.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    pageSize: view === "cards" ? 9 : 10,
  });
  const createProject = useCreateProjectMutation();
  const projects = projectsSummaryQuery.data ?? [];
  const catalog = projectsQuery.data;
  const filteredProjects = catalog?.items ?? [];

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
        title="Projects"
        description="Loading project cards, list filters, and workspace overview."
        bodyClassName="h-[24rem]"
      />
    );
  }

  if (projectsSummaryQuery.isError || projectsQuery.isError) {
    return (
      <ErrorState
        title="Projects unavailable"
        description="The project list could not be loaded from the backend. Retry to restore the workspace."
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
              Workspace
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">Projects</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Browse active delivery work, search quickly, and create new
              projects directly from the connected backend.
            </p>
          </div>

          <Button type="button" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus />
            Create project
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">All projects</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.all}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Total projects currently visible in this workspace.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Active delivery</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.active}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Projects currently in active execution and coordination.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">At risk</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.atRisk}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Projects that may need attention, unblockers, or timeline review.
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
                placeholder="Search projects"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ProjectStatusFilter)
                }
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PLANNING">Planning</option>
                <option value="AT_RISK">At risk</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1">
                <Button
                  type="button"
                  variant={view === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setView("cards")}
                >
                  <LayoutGrid />
                  Cards
                </Button>
                <Button
                  type="button"
                  variant={view === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setView("table")}
                >
                  <List />
                  Table
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {catalog?.total ?? filteredProjects.length} visible
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Filter: {statusFilter === "ALL" ? "All statuses" : statusFilter}
            </Badge>
            {search ? (
              <Badge variant="outline" className="px-3 py-1">
                Search: {search}
              </Badge>
            ) : null}
            <Badge variant="outline" className="px-3 py-1">
              Page {catalog?.page ?? page} of {catalog?.totalPages ?? 1}
            </Badge>
          </div>
        </section>

        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title="No projects yet"
            description="Create your first project to start organizing work, people, and progress in one place."
            action={
              <Button type="button" className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus />
                Create project
              </Button>
            }
          />
        ) : (
          <>
            <ProjectList projects={filteredProjects} view={view} />

            {filteredProjects.length > 0 ? (
              <section className="flex flex-col gap-3 rounded-3xl border border-border bg-background/95 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min(
                    ((catalog?.page ?? page) - 1) * (catalog?.pageSize ?? filteredProjects.length) + 1,
                    catalog?.total ?? filteredProjects.length
                  )}
                  -
                  {Math.min(
                    (catalog?.page ?? page) * (catalog?.pageSize ?? filteredProjects.length),
                    catalog?.total ?? filteredProjects.length
                  )}{" "}
                  of {catalog?.total ?? filteredProjects.length} projects
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(catalog?.page ?? page) <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
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
                    Next
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
