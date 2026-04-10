import { useQuery } from "@tanstack/react-query";

import { emptyProjectsMock, projectsMock } from "@/projects/mock/projectsMock";
import type { Project } from "@/projects/types/project";
import { mockDelay } from "@/shared/api/mockDelay";

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects", "list"],
    queryFn: async () => {
      await mockDelay(450);

      return import.meta.env.VITE_PROJECTS_EMPTY === "1"
        ? emptyProjectsMock
        : projectsMock;
    },
    staleTime: Infinity,
  });
}
