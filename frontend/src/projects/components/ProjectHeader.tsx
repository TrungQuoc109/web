import { FolderKanban, Users } from "lucide-react";

import type { ProjectDetail } from "@/projects/types/project";
import { Badge } from "@/shared/ui/badge";
import { StatusBadge } from "@/shared/ui/status-badge";

type ProjectHeaderProps = {
  project: ProjectDetail;
};

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <header className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-secondary/70 p-3">
              <FolderKanban />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Project detail
              </p>
              <h1 className="truncate text-3xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {project.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={project.status} />
          <Badge variant="outline" className="px-3 py-1">
            <Users />
            {project.memberCount} members
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {project.progress}% complete
          </Badge>
        </div>
      </div>
    </header>
  );
}
