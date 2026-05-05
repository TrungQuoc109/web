import type { ReactNode } from "react";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { useI18n } from "@/i18n/useI18n";
import { useProjectDetail } from "@/projects/hooks/useProjectDetail";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

type ProjectScopedPageShellProps = {
  projectId?: string;
  sectionLabel: string;
  children: (project: NonNullable<ReturnType<typeof useProjectDetail>["data"]>) => ReactNode;
};

export function ProjectScopedPageShell({
  projectId,
  sectionLabel,
  children,
}: ProjectScopedPageShellProps) {
  const { language } = useI18n();
  const detailQuery = useProjectDetail(projectId);

  const ui =
    language === "vi"
      ? {
          backToProjects: "Quay lại danh sách dự án",
          projectContext: "Ngữ cảnh dự án",
          notFoundTitle: "Không tìm thấy dự án",
          notFoundDescription:
            "Dự án này không tồn tại hoặc bạn không còn quyền truy cập vào nó.",
          unavailableTitle: "Không thể tải ngữ cảnh dự án",
          unavailableDescription:
            "Không thể tải thông tin dự án từ backend. Hãy thử lại để khôi phục route theo dự án.",
        }
      : {
          backToProjects: "Back to projects",
          projectContext: "Project context",
          notFoundTitle: "Project not found",
          notFoundDescription:
            "This project does not exist or you no longer have access to it.",
          unavailableTitle: "Project context unavailable",
          unavailableDescription:
            "The project context could not be loaded from the backend. Retry to restore this project route.",
        };

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  if (detailQuery.isPending) {
    return (
      <LoadingState
        title={sectionLabel}
        description={ui.unavailableDescription}
        bodyClassName="h-[20rem]"
      />
    );
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        title={ui.unavailableTitle}
        description={ui.unavailableDescription}
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  const project = detailQuery.data;
  if (!project) {
    return (
      <ErrorState
        title={ui.notFoundTitle}
        description={ui.notFoundDescription}
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {ui.backToProjects}
      </Link>

      <div className="rounded-[2rem] border border-border bg-background/95 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-2xl border border-border bg-secondary/70 p-3">
              <FolderKanban className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {ui.projectContext}
              </p>
              <nav className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link to="/projects" className="hover:text-foreground">
                  Projects
                </Link>
                <span>/</span>
                <Link to={`/projects/${project.id}`} className="hover:text-foreground">
                  {project.name}
                </Link>
                <span>/</span>
                <span className="text-foreground">{sectionLabel}</span>
              </nav>
              <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {children(project)}
    </section>
  );
}

