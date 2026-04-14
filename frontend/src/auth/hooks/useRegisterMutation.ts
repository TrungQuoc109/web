import { useMutation } from "@tanstack/react-query";

import { authService } from "@/auth/services/authService";
import type { RegisterPayload } from "@/auth/types/auth";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { useToastStore } from "@/shared/lib/toast-store";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: RegisterPayload) => authService.register(input),
    onSuccess: () => {
      useToastStore.getState().push({
        title: "Account created",
        description: "You can now sign in with your new account.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Registration failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
