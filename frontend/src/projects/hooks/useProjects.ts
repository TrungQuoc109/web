import { useQuery } from "@tanstack/react-query";

import { projectsService } from "@/projects/services/projectsService";
import type { Project } from "@/projects/types/project";

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects", "list"],
    queryFn: () => projectsService.list(),
    staleTime: 30_000,
  });
}
