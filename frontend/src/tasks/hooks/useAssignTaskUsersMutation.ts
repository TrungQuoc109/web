import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";
import type { TaskAssignmentRole } from "@/tasks/types/task";

type AssignTaskUsersInput = {
  taskId: string;
  userId: string;
  role: TaskAssignmentRole;
};

export function useAssignTaskUsersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId, role }: AssignTaskUsersInput) =>
      tasksApi.assignUsers({
        taskId,
        assignees: [{ userId, role }],
      }),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Assign task user failed");
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.comments(variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
    },
  });
}
