import { FolderKanban, Users } from "lucide-react";
import { Link } from "react-router-dom";

import type { Project } from "@/projects/types/project";
import { getDisplayText } from "@/shared/lib/display";
import { formatProjectUpdatedAt } from "@/shared/lib/format-date";
import { StatusBadge } from "@/shared/ui/status-badge";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-3xl transition-transform hover:-translate-y-0.5"
    >
      <article className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border bg-secondary/70 p-3">
                <FolderKanban />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">{project.name}</h3>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {formatProjectUpdatedAt(project.updatedAt)}
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {getDisplayText(project.description, "No description yet.")}
            </p>
          </div>

          <StatusBadge value={project.status} className="shrink-0" />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users />
            <span>{project.memberCount} members</span>
          </div>
          <p className="text-sm font-medium">{project.progress}% complete</p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground/80 transition-[width]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </article>
    </Link>
  );
}
