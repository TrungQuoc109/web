import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthBootstrap } from "@/auth/hooks/useAuthBootstrap";
import { useAuthStore } from "@/auth/store/authStore";
import { isAuthQueryKey } from "@/shared/lib/query-keys";

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="text-sm text-muted-foreground">Checking your session...</div>
    </div>
  );
}

export function AuthInitializer({ children }: PropsWithChildren) {
  const { isCheckingAuth } = useAuthBootstrap();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const previousTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const previousToken = previousTokenRef.current;
    const tokenChanged =
      previousToken !== null &&
      accessToken !== null &&
      previousToken !== accessToken;
    const sessionCleared = previousToken !== null && accessToken === null;

    if (tokenChanged || sessionCleared) {
      queryClient.removeQueries({
        predicate: (query) => !isAuthQueryKey(query.queryKey),
      });
    }

    previousTokenRef.current = accessToken;
  }, [accessToken, hasHydrated, queryClient]);

  if (isCheckingAuth) {
    return <AuthLoadingScreen />;
  }

  return children;
}
