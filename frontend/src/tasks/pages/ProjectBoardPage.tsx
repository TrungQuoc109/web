import { useParams } from "react-router-dom";

import { ProjectScopedPageShell } from "@/projects/components/ProjectScopedPageShell";
import { TasksPage } from "@/tasks/pages/TasksPage";

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <ProjectScopedPageShell projectId={projectId} sectionLabel="Board">
      {(project) => (
        <TasksPage
          forcedProjectId={project.id}
          projectName={project.name}
          contextMode="board"
        />
      )}
    </ProjectScopedPageShell>
  );
}

