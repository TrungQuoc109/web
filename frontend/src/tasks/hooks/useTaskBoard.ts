import { useQuery } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskItem } from "@/tasks/types/task";
import { tasksKeys } from "@/shared/lib/query-keys";

export function useTaskBoard() {
  return useQuery<TaskItem[]>({
    queryKey: tasksKeys.board(),
    queryFn: () => tasksApi.getBoard(),
    staleTime: 30_000,
  });
}
