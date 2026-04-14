import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksService } from "@/tasks/services/tasksService";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { showErrorToast } from "@/shared/lib/toast-store";

type AssignTaskUsersInput = {
  taskId: string;
  userId: string;
};

export function useAssignTaskUsersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId }: AssignTaskUsersInput) =>
      tasksService.assignUsers({
        taskId,
        userIds: [userId],
      }),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Assign task user failed");
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "board"] });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId, "comments"],
      });
    },
  });
}
