import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/auth/store/authStore";
import { httpClient } from "@/shared/api/http-client";
import { useToastStore } from "@/shared/lib/toast-store";

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return useCallback((options?: { silent?: boolean }) => {
    // Best-effort server-side session revocation (cookie-based refresh token).
    void httpClient.post("/auth/logout", {});
    clearSession();
    queryClient.clear();
    if (!options?.silent) {
      useToastStore.getState().push({
        title: "Signed out",
        description: "You have been logged out successfully.",
        variant: "info",
      });
    }
  }, [clearSession, queryClient]);
}
