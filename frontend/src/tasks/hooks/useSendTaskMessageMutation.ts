import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/auth/store/authStore";
import { messagesApi } from "@/messages/api/messagesApi";
import { sendRealtimeTaskMessage } from "@/realtime/lib/realtime-actions";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useSendTaskMessageMutation() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (payload: { taskId: string; content: string }) => {
      if (!accessToken) {
        return messagesApi.sendTaskMessage(payload);
      }

      try {
        return await sendRealtimeTaskMessage(accessToken, payload);
      } catch {
        return messagesApi.sendTaskMessage(payload);
      }
    },
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
