import { emptyTasksMock, tasksMock } from "@/tasks/mock/tasksMock";
import type { TaskItem } from "@/tasks/types/task";
import { mockDelay } from "@/shared/api/mockDelay";

export const tasksMockService = {
  async getBoard(): Promise<TaskItem[]> {
    await mockDelay(400);

    return import.meta.env.VITE_TASKS_EMPTY === "1"
      ? emptyTasksMock
      : tasksMock;
  },
};
