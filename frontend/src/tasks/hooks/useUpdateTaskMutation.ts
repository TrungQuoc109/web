import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskItem } from "@/tasks/types/task";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";
import { getCurrentTranslation } from "@/i18n/useI18n";

type UpdateTaskInput = {
  taskId: string;
  projectId: string;
  title: string;
  description?: string;
  priority: TaskItem["priority"];
};

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, title, description, priority }: UpdateTaskInput) =>
      tasksApi.update({
        taskId,
        title,
        description,
        priority,
      }),
    onSuccess: (task, variables) => {
      queryClient.setQueryData<TaskItem[]>(tasksKeys.board(), (current = []) =>
        current.map((item) => (item.id === task.id ? { ...item, ...task } : item))
      );

      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(variables.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: getCurrentTranslation("toast.taskUpdatedTitle"),
        description: getCurrentTranslation("toast.taskUpdatedDescription"),
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: getCurrentTranslation("toast.updateTaskFailedTitle"),
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
