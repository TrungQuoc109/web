import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type CreateTaskPayload, tasksApi } from "@/tasks/api/tasksApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(task.projectId) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: "Task created",
        description: "The new task is now available in the task board.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Create task failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
