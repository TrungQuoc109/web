import { useQuery } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { tasksKeys } from "@/shared/lib/query-keys";
import type { TasksCatalog, TaskPriorityFilter, TaskStatusFilter } from "@/tasks/types/task";

type UseTasksByProjectFilters = {
  search?: string;
  status?: TaskStatusFilter;
  priority?: TaskPriorityFilter;
  assigneeId?: string;
  page?: number;
  pageSize?: number;
};

export function useTasksByProject(
  projectId?: string,
  filters: UseTasksByProjectFilters = {}
) {
  return useQuery<TasksCatalog>({
    queryKey: tasksKeys.project(projectId, filters),
    queryFn: () =>
      tasksApi.listCatalog({
        projectId: projectId!,
        search: filters.search?.trim() || undefined,
        status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
        priority:
          filters.priority && filters.priority !== "ALL"
            ? filters.priority
            : undefined,
        assigneeId: filters.assigneeId || undefined,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 24,
      }),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}

