import { Link } from "react-router-dom";

import { useI18n } from "@/i18n/useI18n";
import type { Project } from "@/projects/types/project";

import { ProjectCard } from "@/projects/components/ProjectCard";
import { getDisplayText } from "@/shared/lib/display";
import { formatProjectUpdatedAt } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatusBadge } from "@/shared/ui/status-badge";

type ProjectListProps = {
  projects: Project[];
  view: "cards" | "table";
};

export function ProjectList({ projects, view }: ProjectListProps) {
  const { t } = useI18n();

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={null}
        title={t("projects.list.emptyTitle")}
        description={t("projects.list.emptyDescription")}
      />
    );
  }

  if (view === "table") {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-background/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-secondary/60 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">{t("projects.list.table.project")}</th>
                <th className="px-6 py-4 font-medium">{t("projects.list.table.members")}</th>
                <th className="px-6 py-4 font-medium">{t("projects.list.table.progress")}</th>
                <th className="px-6 py-4 font-medium">{t("projects.list.table.status")}</th>
                <th className="px-6 py-4 font-medium">{t("projects.list.table.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-border">
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="max-w-md text-muted-foreground">
                        {getDisplayText(project.description, t("projects.list.noDescription"))}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-muted-foreground">
                    {project.memberCount}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex min-w-40 flex-col gap-2">
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-foreground/80"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground">
                        {t("projects.list.progressComplete", {
                          percent: project.progress,
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge value={project.status} />
                  </td>
                  <td className="px-6 py-5 text-muted-foreground">
                    {formatProjectUpdatedAt(project.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
