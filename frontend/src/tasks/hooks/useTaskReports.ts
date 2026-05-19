import { useQuery } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskReport } from "@/tasks/types/task";
import { tasksKeys } from "@/shared/lib/query-keys";

export function useTaskReports(taskId?: string) {
  return useQuery<TaskReport[]>({
    queryKey: tasksKeys.reports(taskId),
    queryFn: () => tasksApi.getReports(taskId!),
    enabled: Boolean(taskId),
    staleTime: 10_000,
  });
}
