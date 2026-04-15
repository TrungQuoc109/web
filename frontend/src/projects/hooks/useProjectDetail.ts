import { useQuery } from "@tanstack/react-query";

import { projectApi } from "@/projects/api/projectApi";
import type { ProjectDetail } from "@/projects/types/project";
import { projectsKeys } from "@/shared/lib/query-keys";

export function useProjectDetail(projectId?: string) {
  return useQuery<ProjectDetail | null>({
    queryKey: projectsKeys.detail(projectId),
    queryFn: async () => {
      if (!projectId) return null;
      return projectApi.getDetail(projectId);
    },
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
