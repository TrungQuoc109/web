import { useQuery } from "@tanstack/react-query";

import { projectApi, type ListProjectsCatalogFilters } from "@/projects/api/projectApi";
import type { ProjectsCatalog } from "@/projects/types/project";
import { projectsKeys } from "@/shared/lib/query-keys";

export function useProjectsCatalog(filters: ListProjectsCatalogFilters) {
  return useQuery<ProjectsCatalog>({
    queryKey: projectsKeys.catalog(filters),
    queryFn: () => projectApi.listCatalog(filters),
    staleTime: 30_000,
  });
}
