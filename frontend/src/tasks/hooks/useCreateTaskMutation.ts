import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type CreateTaskPayload, tasksApi } from "@/tasks/api/tasksApi";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useCreateTaskMutation() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(task.projectId) });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.activity(task.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: t("toast.taskCreatedTitle"),
        description: t("toast.taskCreatedDescription"),
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: t("toast.createTaskFailedTitle"),
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
