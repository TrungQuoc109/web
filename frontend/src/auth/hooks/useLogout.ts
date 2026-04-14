import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/auth/store/authStore";
import { useToastStore } from "@/shared/lib/toast-store";

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return useCallback((options?: { silent?: boolean }) => {
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
