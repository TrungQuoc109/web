import { useQuery } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskUser } from "@/tasks/types/task";
import { tasksKeys } from "@/shared/lib/query-keys";

export function useAssignableUsers(projectId?: string) {
  return useQuery<TaskUser[]>({
    queryKey: tasksKeys.projectMembers(projectId),
    queryFn: () => tasksApi.getAssignableUsers(projectId!),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
