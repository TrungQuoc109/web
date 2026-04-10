import { useQuery } from "@tanstack/react-query";

import * as authApi from "@/auth/api/authApi";
import { useAuthStore } from "@/auth/store/authStore";

export function useAuthMeQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    retry: 0,
  });
}

