import { useQuery } from "@tanstack/react-query";

import { tasksService } from "@/tasks/services/tasksService";
import type { TaskUser } from "@/tasks/types/task";

export function useAssignableUsers(projectId?: string) {
  return useQuery<TaskUser[]>({
    queryKey: ["tasks", "project-members", projectId],
    queryFn: () => tasksService.getAssignableUsers(projectId!),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
