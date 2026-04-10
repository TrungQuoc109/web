import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/auth/store/authStore";

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useCallback(() => {
    logout();
    queryClient.removeQueries({ queryKey: ["auth"] });
  }, [logout, queryClient]);
}

