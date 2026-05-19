import { useMutation } from "@tanstack/react-query";

import { changePassword } from "@/auth/api/authApi";
import type { ChangePasswordPayload } from "@/auth/types/auth";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { useToastStore } from "@/shared/lib/toast-store";

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: (result) => {
      useToastStore.getState().push({
        title: "Password updated",
        description:
          result.message || "Your password has been changed successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Password update failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
