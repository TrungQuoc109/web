import { ArrowRight, FolderKanban, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Project } from "@/projects/types/project";
import { formatProjectUpdatedAt } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatusBadge } from "@/shared/ui/status-badge";

type ProjectSpotlightProps = {
  projects: Project[];
};

function sortProjects(projects: Project[]) {
  const statusScore: Record<Project["status"], number> = {
    AT_RISK: 0,
    ACTIVE: 1,
    PLANNING: 2,
    COMPLETED: 3,
  };

  return [...projects].sort((left, right) => {
    const statusDifference = statusScore[left.status] - statusScore[right.status];
    if (statusDifference !== 0) {
      return statusDifference;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function ProjectSpotlight({ projects }: ProjectSpotlightProps) {
  const navigate = useNavigate();
  const spotlightProjects = sortProjects(projects).slice(0, 3);

  if (spotlightProjects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban />}
        title="No projects yet"
        description="Create a project to start seeing project health, progress, and delivery movement here."
      />
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Project spotlight</h3>
          <p className="text-sm text-muted-foreground">
            The projects most worth checking right now.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="gap-2"
          onClick={() => navigate("/projects")}
        >
          View all
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {spotlightProjects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => navigate(`/projects/${project.id}`)}
            className="rounded-3xl border border-border bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.92))] p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <FolderKanban className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{project.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatProjectUpdatedAt(project.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <StatusBadge value={project.status} className="shrink-0" />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>{project.memberCount} members</span>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {project.progress}% complete
              </Badge>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-foreground/80 transition-[width]"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
