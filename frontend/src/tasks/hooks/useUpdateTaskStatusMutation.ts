import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksService } from "@/tasks/services/tasksService";
import type { TaskItem, TaskStatus } from "@/tasks/types/task";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { showErrorToast } from "@/shared/lib/toast-store";

type UpdateTaskStatusInput = {
  taskId: string;
  status: TaskStatus;
};

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTaskStatusInput) => tasksService.updateStatus(payload),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", "board"] });

      const previousTasks = queryClient.getQueryData<TaskItem[]>(["tasks", "board"]);

      queryClient.setQueryData<TaskItem[]>(["tasks", "board"], (current = []) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", "board"], context.previousTasks);
      }
      showErrorToast(getApiErrorMessage(error), "Update task status failed");
    },
    onSuccess: (task) => {
      queryClient.setQueryData<TaskItem[]>(["tasks", "board"], (current = []) =>
        current.map((item) => (item.id === task.id ? { ...item, ...task } : item))
      );
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "board"] });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId, "comments"],
      });
    },
  });
}
