import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as authApi from "@/auth/api/authApi";
import { useAuthStore } from "@/auth/store/authStore";

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (input: authApi.RegisterInput) => {
      const { accessToken, user } = await authApi.register(input);
      const currentUser = user ?? (await authApi.me(accessToken));
      return { accessToken, currentUser };
    },
    onSuccess: ({ accessToken, currentUser }) => {
      setSession({ accessToken, currentUser });
      queryClient.setQueryData(["auth", "me"], currentUser);
    },
  });
}

