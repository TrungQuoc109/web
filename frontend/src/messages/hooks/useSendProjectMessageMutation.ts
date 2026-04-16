import { useMutation, useQueryClient } from "@tanstack/react-query";

import { messagesApi } from "@/messages/api/messagesApi";
import { useAuthStore } from "@/auth/store/authStore";
import { sendRealtimeProjectMessage } from "@/realtime/lib/realtime-actions";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, messagesKeys, projectsKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

type SendProjectMessageInput = {
  projectId: string;
  content: string;
  isAnnouncement?: boolean;
};

export function useSendProjectMessageMutation() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (payload: SendProjectMessageInput) => {
      if (!accessToken) {
        return messagesApi.sendProjectMessage(payload);
      }

      try {
        return await sendRealtimeProjectMessage(accessToken, payload);
      } catch {
        return messagesApi.sendProjectMessage(payload);
      }
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Send message failed");
    },
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({ queryKey: messagesKeys.project(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}
