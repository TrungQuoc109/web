import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/auth/store/authStore";

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="text-sm text-muted-foreground">Checking your session...</div>
    </div>
  );
}

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated || (accessToken && !currentUser)) {
    return <AuthLoadingScreen />;
  }

  if (!accessToken || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          error: accessToken
            ? "Your session is no longer valid. Please sign in again."
            : undefined,
        }}
      />
    );
  }

  return children;
}
