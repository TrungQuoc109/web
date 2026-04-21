import { useQuery } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import type { TasksCatalog, TaskStatusFilter, TaskPriorityFilter } from "@/tasks/types/task";
import { tasksKeys } from "@/shared/lib/query-keys";

type UseTasksCatalogFilters = {
  search?: string;
  projectId?: string;
  status?: TaskStatusFilter;
  priority?: TaskPriorityFilter;
  assigneeId?: string;
  page?: number;
  pageSize?: number;
};

export function useTasksCatalog(filters: UseTasksCatalogFilters) {
  return useQuery<TasksCatalog>({
    queryKey: tasksKeys.catalog(filters),
    queryFn: () =>
      tasksApi.listCatalog({
        search: filters.search?.trim() || undefined,
        projectId: filters.projectId || undefined,
        status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
        priority:
          filters.priority && filters.priority !== "ALL"
            ? filters.priority
            : undefined,
        assigneeId: filters.assigneeId || undefined,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 24,
      }),
    staleTime: 30_000,
  });
}
