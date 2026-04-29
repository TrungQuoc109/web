import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";
import type { TaskAssignmentRole, TasksCatalog } from "@/tasks/types/task";

type AssignTaskUsersInput = {
  taskId: string;
  userId: string;
  role: TaskAssignmentRole;
};

export function useAssignTaskUsersMutation() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId, role }: AssignTaskUsersInput) =>
      tasksApi.assignUsers({
        taskId,
        assignees: [{ userId, role }],
      }),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), t("toast.assignTaskUserFailedTitle"));
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.comments(variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
      const task = queryClient
        .getQueriesData<TasksCatalog>({ queryKey: tasksKeys.all })
        .flatMap(([, data]) => data?.items ?? [])
        .find((item) => item.id === variables.taskId);
      if (task?.projectId) {
        void queryClient.invalidateQueries({
          queryKey: projectsKeys.activity(task.projectId),
        });
      }
    },
  });
}
