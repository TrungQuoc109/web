import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authService } from "@/auth/services/authService";
import type { LoginPayload } from "@/auth/types/auth";
import { useAuthStore } from "@/auth/store/authStore";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { showErrorToast } from "@/shared/lib/toast-store";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (input: LoginPayload) => {
      const { accessToken, user } = await authService.login(input);
      const currentUser = user ?? (await authService.getMe(accessToken));
      return { accessToken, currentUser };
    },
    onSuccess: ({ accessToken, currentUser }) => {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      setSession({ accessToken, currentUser });
      queryClient.setQueryData(["auth", "me"], currentUser);
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Sign in failed");
    },
  });
}
