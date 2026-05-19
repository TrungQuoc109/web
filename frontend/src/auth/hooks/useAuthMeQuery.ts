import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/auth/api/authApi";
import { useAuthStore } from "@/auth/store/authStore";
import { authKeys } from "@/shared/lib/query-keys";

type UseAuthMeQueryOptions = {
  enabled?: boolean;
};

export function useAuthMeQuery(options?: UseAuthMeQueryOptions) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => getMe(),
    enabled: options?.enabled ?? Boolean(accessToken),
    staleTime: 30_000,
    retry: 0,
  });
}
