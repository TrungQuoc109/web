import { useMutation, useQueryClient } from "@tanstack/react-query";

import { messagesApi } from "@/messages/api/messagesApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useSendTaskMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { taskId: string; content: string }) =>
      messagesApi.sendTaskMessage(payload),
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({
        queryKey: tasksKeys.comments(variables.taskId),
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Send comment failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
