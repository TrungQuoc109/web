import type { TaskPriorityFilter, TaskStatusFilter } from "@/tasks/types/task";
import { useTasksByProject } from "@/tasks/hooks/useTasksByProject";

type UseProjectBoardFilters = {
  search?: string;
  status?: TaskStatusFilter;
  priority?: TaskPriorityFilter;
  assigneeId?: string;
  page?: number;
  pageSize?: number;
};

export function useProjectBoard(
  projectId?: string,
  filters: UseProjectBoardFilters = {}
) {
  return useTasksByProject(projectId, filters);
}

