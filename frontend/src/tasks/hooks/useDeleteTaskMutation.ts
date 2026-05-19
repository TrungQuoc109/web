import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskItem } from "@/tasks/types/task";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

type DeleteTaskInput = {
  taskId: string;
  projectId: string;
};

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: DeleteTaskInput) => tasksApi.remove(taskId),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<TaskItem[]>(tasksKeys.board(), (current = []) =>
        current.filter((item) => item.id !== variables.taskId)
      );

      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(variables.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: "Task deleted",
        description: "The task was removed from the board.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Delete task failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
