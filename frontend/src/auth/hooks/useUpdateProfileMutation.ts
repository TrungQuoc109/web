import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProfile } from "@/auth/api/authApi";
import type { UpdateProfilePayload } from "@/auth/types/auth";
import { useAuthStore } from "@/auth/store/authStore";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { authKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useUpdateProfileMutation() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (currentUser) => {
      setSession({
        accessToken,
        currentUser,
      });
      queryClient.setQueryData(authKeys.me(), currentUser);

      useToastStore.getState().push({
        title: t("toast.profileUpdatedTitle"),
        description: t("toast.profileUpdatedDescription"),
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: t("toast.profileUpdateFailedTitle"),
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
