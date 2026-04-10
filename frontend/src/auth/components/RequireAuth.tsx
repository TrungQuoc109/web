import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { autoLoginEnabled } from "@/auth/config/devAuth";
import { useAutoLogin } from "@/auth/hooks/useAutoLogin";
import { useAuthStore } from "@/auth/store/authStore";
import { useAuthMeQuery } from "@/auth/hooks/useAuthMeQuery";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";

export function RequireAuth({ children }: PropsWithChildren) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.currentUser);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const autoLogin = useAutoLogin(!accessToken && autoLoginEnabled);
  const meQuery = useAuthMeQuery();

  useEffect(() => {
    if (meQuery.data) setCurrentUser(meQuery.data);
  }, [meQuery.data, setCurrentUser]);

  if (!hasHydrated) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!accessToken) {
    if (autoLoginEnabled) {
      if (autoLogin.isPending) {
        return (
          <div className="grid min-h-dvh place-items-center p-6">
            <div className="text-sm text-muted-foreground">
              Signing in with default account...
            </div>
          </div>
        );
      }

      if (autoLogin.isError) {
        return (
          <Navigate
            to="/login"
            replace
            state={{
              from: location,
              error: getApiErrorMessage(autoLogin.error),
            }}
          />
        );
      }
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (meQuery.isError) {
    logout();
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, error: getApiErrorMessage(meQuery.error) }}
      />
    );
  }

  if (!currentUser) {
    if (meQuery.isPending) {
      return (
        <div className="grid min-h-dvh place-items-center p-6">
          <div className="text-sm text-muted-foreground">Loading profile...</div>
        </div>
      );
    }

    // meQuery.isError handled above
  }

  return children;
}
