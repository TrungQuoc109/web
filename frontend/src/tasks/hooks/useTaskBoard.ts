import { useQuery } from "@tanstack/react-query";

import { tasksService } from "@/tasks/services/tasksService";
import type { TaskItem } from "@/tasks/types/task";

export function useTaskBoard() {
  return useQuery<TaskItem[]>({
    queryKey: ["tasks", "board"],
    queryFn: () => tasksService.getBoard(),
    staleTime: 30_000,
  });
}
