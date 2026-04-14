import { useQuery } from "@tanstack/react-query";

import { authService } from "@/auth/services/authService";
import { useAuthStore } from "@/auth/store/authStore";

type UseAuthMeQueryOptions = {
  enabled?: boolean;
};

export function useAuthMeQuery(options?: UseAuthMeQueryOptions) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.getMe(),
    enabled: options?.enabled ?? Boolean(accessToken),
    staleTime: 30_000,
    retry: 0,
  });
}
