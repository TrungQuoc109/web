import { useQuery } from "@tanstack/react-query";

import { projectsService } from "@/projects/services/projectsService";
import type { ProjectDetail } from "@/projects/types/project";

export function useProjectDetail(projectId?: string) {
  return useQuery<ProjectDetail | null>({
    queryKey: ["projects", "detail", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return projectsService.getDetail(projectId);
    },
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
