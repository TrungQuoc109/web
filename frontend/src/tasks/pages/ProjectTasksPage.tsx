import { useParams } from "react-router-dom";

import { ProjectScopedPageShell } from "@/projects/components/ProjectScopedPageShell";
import { TasksPage } from "@/tasks/pages/TasksPage";

export function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <ProjectScopedPageShell projectId={projectId} sectionLabel="Tasks">
      {(project) => (
        <TasksPage
          forcedProjectId={project.id}
          projectName={project.name}
          contextMode="tasks"
        />
      )}
    </ProjectScopedPageShell>
  );
}

