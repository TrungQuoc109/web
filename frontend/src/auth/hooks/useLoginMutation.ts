import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getMe, login } from "@/auth/api/authApi";
import type { LoginPayload } from "@/auth/types/auth";
import { useAuthStore } from "@/auth/store/authStore";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { authKeys, isAuthQueryKey } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (input: LoginPayload) => {
      const { accessToken, user } = await login(input);
      const currentUser = user ?? (await getMe(accessToken));
      return { accessToken, currentUser };
    },
    onSuccess: ({ accessToken, currentUser }) => {
      queryClient.removeQueries({
        predicate: (query) => !isAuthQueryKey(query.queryKey),
      });
      setSession({ accessToken, currentUser });
      queryClient.setQueryData(authKeys.me(), currentUser);
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Sign in failed");
    },
  });
}
