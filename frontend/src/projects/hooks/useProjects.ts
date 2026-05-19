import { useQuery } from "@tanstack/react-query";

import { projectApi } from "@/projects/api/projectApi";
import type { Project } from "@/projects/types/project";
import { projectsKeys } from "@/shared/lib/query-keys";

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: projectsKeys.list(),
    queryFn: () => projectApi.list(),
    staleTime: 30_000,
  });
}
