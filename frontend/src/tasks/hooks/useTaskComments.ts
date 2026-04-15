import { useQuery } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskComment } from "@/tasks/types/task";
import { tasksKeys } from "@/shared/lib/query-keys";

export function useTaskComments(taskId?: string) {
  return useQuery<TaskComment[]>({
    queryKey: tasksKeys.comments(taskId),
    queryFn: () => tasksApi.getComments(taskId!),
    enabled: Boolean(taskId),
    staleTime: 10_000,
  });
}
