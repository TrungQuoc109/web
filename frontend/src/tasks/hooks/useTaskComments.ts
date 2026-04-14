import { useQuery } from "@tanstack/react-query";

import { tasksService } from "@/tasks/services/tasksService";
import type { TaskComment } from "@/tasks/types/task";

export function useTaskComments(taskId?: string) {
  return useQuery<TaskComment[]>({
    queryKey: ["tasks", "detail", taskId, "comments"],
    queryFn: () => tasksService.getComments(taskId!),
    enabled: Boolean(taskId),
    staleTime: 10_000,
  });
}
