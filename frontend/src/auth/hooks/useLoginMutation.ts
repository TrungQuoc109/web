import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as authApi from "@/auth/api/authApi";
import { useAuthStore } from "@/auth/store/authStore";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (input: authApi.LoginInput) => {
      const { accessToken, user } = await authApi.login(input);
      const currentUser = user ?? (await authApi.me(accessToken));
      return { accessToken, currentUser };
    },
    onSuccess: ({ accessToken, currentUser }) => {
      setSession({ accessToken, currentUser });
      queryClient.setQueryData(["auth", "me"], currentUser);
    },
  });
}

