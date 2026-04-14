import { projectApi, type CreateProjectPayload } from "@/projects/api/projectApi";
import type { Project, ProjectDetail } from "@/projects/types/project";

type ProjectsApiService = {
  list: () => Promise<Project[]>;
  getDetail: (projectId: string) => Promise<ProjectDetail | null>;
  create: (payload: CreateProjectPayload) => Promise<Project>;
};

export const projectsApiService: ProjectsApiService = {
  list: projectApi.list,
  getDetail: projectApi.getDetail,
  create: projectApi.create,
};
