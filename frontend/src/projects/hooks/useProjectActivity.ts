import { useQuery } from "@tanstack/react-query";

import { projectApi } from "@/projects/api/projectApi";
import type { ProjectActivity } from "@/projects/types/project";
import { projectsKeys } from "@/shared/lib/query-keys";

export function useProjectActivity(projectId?: string) {
  return useQuery<ProjectActivity[]>({
    queryKey: projectsKeys.activity(projectId),
    queryFn: () => projectApi.getActivity(projectId!),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
