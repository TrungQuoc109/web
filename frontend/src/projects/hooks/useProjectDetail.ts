import { useQuery } from "@tanstack/react-query";

import { projectDetailMock } from "@/projects/mock/projectDetailMock";
import type { ProjectDetail } from "@/projects/types/project";
import { mockDelay } from "@/shared/api/mockDelay";

export function useProjectDetail(projectId?: string) {
  return useQuery<ProjectDetail | null>({
    queryKey: ["projects", "detail", projectId],
    queryFn: async () => {
      await mockDelay(350);
      if (!projectId) return null;
      return projectDetailMock[projectId] ?? null;
    },
    enabled: Boolean(projectId),
    staleTime: Infinity,
  });
}
