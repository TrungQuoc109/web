import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

type RemoveTaskAssignmentInput = {
  taskId: string;
  assignmentId: string;
};

export function useRemoveTaskAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RemoveTaskAssignmentInput) =>
      tasksApi.removeAssignment(payload),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Remove task assignment failed");
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({
        queryKey: tasksKeys.comments(variables.taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: tasksKeys.reports(variables.taskId),
      });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
    },
  });
}
