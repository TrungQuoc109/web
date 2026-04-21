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
import { useI18n } from "@/i18n/useI18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

export function ProjectsPage() {
  const { language } = useI18n();
  const ui =
    language === "vi"
      ? {
          workspace: "Không gian làm việc",
          title: "Dự án",
          subtitle:
            "Duyệt các dự án đang chạy, tìm kiếm nhanh và tạo dự án mới trực tiếp từ backend đã kết nối.",
          loading:
            "Đang tải danh sách dự án, bộ lọc và phần tổng quan workspace.",
          unavailableTitle: "Không thể tải dự án",
          unavailableDescription:
            "Không thể tải danh sách dự án từ backend. Hãy thử lại để khôi phục workspace.",
          createProject: "Tạo dự án",
          allProjects: "Tất cả dự án",
          allProjectsHelp:
            "Tổng số dự án hiện đang hiển thị trong workspace này.",
          activeDelivery: "Đang triển khai",
          activeDeliveryHelp:
            "Các dự án hiện đang ở trạng thái thực thi và phối hợp.",
          atRisk: "Rủi ro",
          atRiskHelp:
            "Các dự án có thể cần thêm chú ý, gỡ chặn hoặc xem lại tiến độ.",
          search: "Tìm kiếm dự án",
          allStatuses: "Tất cả trạng thái",
          active: "Đang hoạt động",
          planning: "Lập kế hoạch",
          completed: "Hoàn thành",
          cards: "Thẻ",
          table: "Bảng",
          visible: "đang hiển thị",
          filter: "Bộ lọc",
          searchLabel: "Tìm kiếm",
          page: "Trang",
          of: "trên",
          noProjects: "Chưa có dự án nào",
          noProjectsDescription:
            "Hãy tạo dự án đầu tiên để bắt đầu tổ chức công việc, con người và tiến độ tại một nơi.",
          showing: "Hiển thị",
          previous: "Trước",
          next: "Sau",
          selectedProject: "Dự án đã chọn",
        }
      : {
          workspace: "Workspace",
          title: "Projects",
          subtitle:
            "Browse active delivery work, search quickly, and create new projects directly from the connected backend.",
          loading:
            "Loading project cards, list filters, and workspace overview.",
          unavailableTitle: "Projects unavailable",
          unavailableDescription:
            "The project list could not be loaded from the backend. Retry to restore the workspace.",
          createProject: "Create project",
          allProjects: "All projects",
          allProjectsHelp:
            "Total projects currently visible in this workspace.",
          activeDelivery: "Active delivery",
          activeDeliveryHelp:
            "Projects currently in active execution and coordination.",
          atRisk: "At risk",
          atRiskHelp:
            "Projects that may need attention, unblockers, or timeline review.",
          search: "Search projects",
          allStatuses: "All statuses",
          active: "Active",
          planning: "Planning",
          completed: "Completed",
          cards: "Cards",
          table: "Table",
          visible: "visible",
          filter: "Filter",
          searchLabel: "Search",
          page: "Page",
          of: "of",
          noProjects: "No projects yet",
          noProjectsDescription:
            "Create your first project to start organizing work, people, and progress in one place.",
          showing: "Showing",
          previous: "Previous",
          next: "Next",
          selectedProject: "Selected project",
        };
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
        description={ui.loading}
        bodyClassName="h-[24rem]"
      />
    );
  }

  if (projectsSummaryQuery.isError || projectsQuery.isError) {
    return (
      <ErrorState
        title={ui.unavailableTitle}
        description={ui.unavailableDescription}
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
              {ui.workspace}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">{ui.title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {ui.subtitle}
            </p>
          </div>

          <Button type="button" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus />
            {ui.createProject}
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{ui.allProjects}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.all}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {ui.allProjectsHelp}
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{ui.activeDelivery}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.active}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {ui.activeDeliveryHelp}
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{ui.atRisk}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {statusCounts.atRisk}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {ui.atRiskHelp}
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
                placeholder={ui.search}
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
                <option value="ALL">{ui.allStatuses}</option>
                <option value="ACTIVE">{ui.active}</option>
                <option value="PLANNING">{ui.planning}</option>
                <option value="AT_RISK">{ui.atRisk}</option>
                <option value="COMPLETED">{ui.completed}</option>
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
                  {ui.cards}
                </Button>
                <Button
                  type="button"
                  variant={view === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setView("table")}
                >
                  <List />
                  {ui.table}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {catalog?.total ?? filteredProjects.length} {ui.visible}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {ui.filter}: {statusFilter === "ALL" ? ui.allStatuses : statusFilter}
            </Badge>
            {search ? (
              <Badge variant="outline" className="px-3 py-1">
                {ui.searchLabel}: {search}
              </Badge>
            ) : null}
            <Badge variant="outline" className="px-3 py-1">
              {ui.page} {catalog?.page ?? page} {ui.of} {catalog?.totalPages ?? 1}
            </Badge>
          </div>
        </section>

        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title={ui.noProjects}
            description={ui.noProjectsDescription}
            action={
              <Button type="button" className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus />
                {ui.createProject}
              </Button>
            }
          />
        ) : (
          <>
            <ProjectList projects={filteredProjects} view={view} />

            {filteredProjects.length > 0 ? (
              <section className="flex flex-col gap-3 rounded-3xl border border-border bg-background/95 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {ui.showing}{" "}
                  {Math.min(
                    ((catalog?.page ?? page) - 1) * (catalog?.pageSize ?? filteredProjects.length) + 1,
                    catalog?.total ?? filteredProjects.length
                  )}
                  -
                  {Math.min(
                    (catalog?.page ?? page) * (catalog?.pageSize ?? filteredProjects.length),
                    catalog?.total ?? filteredProjects.length
                  )}{" "}
                  {ui.of} {catalog?.total ?? filteredProjects.length} {ui.title.toLowerCase()}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(catalog?.page ?? page) <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    {ui.previous}
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
                    {ui.next}
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
