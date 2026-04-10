import { useQuery } from "@tanstack/react-query";

import { emptyTasksMock, tasksMock } from "@/tasks/mock/tasksMock";
import type { TaskItem } from "@/tasks/types/task";
import { mockDelay } from "@/shared/api/mockDelay";

export function useTaskBoard() {
  return useQuery<TaskItem[]>({
    queryKey: ["tasks", "board"],
    queryFn: async () => {
      await mockDelay(400);

      return import.meta.env.VITE_TASKS_EMPTY === "1" ? emptyTasksMock : tasksMock;
    },
    staleTime: Infinity,
  });
}
