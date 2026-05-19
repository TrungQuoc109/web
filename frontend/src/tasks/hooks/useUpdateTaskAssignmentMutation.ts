import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";
import type { TaskAssignmentRole } from "@/tasks/types/task";

type UpdateTaskAssignmentInput = {
  taskId: string;
  assignmentId: string;
  role: TaskAssignmentRole;
};

export function useUpdateTaskAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTaskAssignmentInput) =>
      tasksApi.updateAssignment(payload),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Update task assignment failed");
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
