import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

type AssignTaskUsersInput = {
  taskId: string;
  userId: string;
};

export function useAssignTaskUsersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId }: AssignTaskUsersInput) =>
      tasksApi.assignUsers({
        taskId,
        userIds: [userId],
      }),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Assign task user failed");
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.board() });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.comments(variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
    },
  });
}
