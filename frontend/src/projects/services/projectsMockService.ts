import { projectDetailMock } from "@/projects/mock/projectDetailMock";
import { emptyProjectsMock, projectsMock } from "@/projects/mock/projectsMock";
import type { Project, ProjectDetail } from "@/projects/types/project";
import { mockDelay } from "@/shared/api/mockDelay";

export const projectsMockService = {
  async list(): Promise<Project[]> {
    await mockDelay(450);

    return import.meta.env.VITE_PROJECTS_EMPTY === "1"
      ? emptyProjectsMock
      : projectsMock;
  },

  async getDetail(projectId: string): Promise<ProjectDetail | null> {
    await mockDelay(350);

    return projectDetailMock[projectId] ?? null;
  },
};
