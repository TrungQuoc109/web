import { useEffect, useRef, useState } from "react";

import { getMe } from "@/auth/api/authApi";
import { refreshAuthSessionRequest } from "@/auth/api/refreshApi";
import { useAuthMeQuery } from "@/auth/hooks/useAuthMeQuery";
import { useAuthStore } from "@/auth/store/authStore";
import { normalizeApiError } from "@/shared/api/normalizeApiError";

export function useAuthBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setSession = useAuthStore((state) => state.setSession);

  const didAttemptRefreshRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shouldFetchCurrentUser =
    hasHydrated && Boolean(accessToken) && !currentUser;

  const meQuery = useAuthMeQuery({
    enabled: shouldFetchCurrentUser,
  });

  useEffect(() => {
    if (meQuery.data) {
      setCurrentUser(meQuery.data);
    }
  }, [meQuery.data, setCurrentUser]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (accessToken) {
      return;
    }

    if (didAttemptRefreshRef.current) {
      return;
    }

    didAttemptRefreshRef.current = true;
    setIsRefreshing(true);

    refreshAuthSessionRequest()
      .then(async (session) => {
        const user = session.user ?? (await getMe(session.accessToken));
        setSession({
          accessToken: session.accessToken,
          currentUser: user,
        });
      })
      .catch(() => {
        // No active refresh cookie or refresh failed: treat as signed out.
      })
      .finally(() => setIsRefreshing(false));
  }, [accessToken, hasHydrated, setSession]);

  useEffect(() => {
    if (!meQuery.isError) {
      return;
    }

    const normalizedError = normalizeApiError(meQuery.error);
    if (normalizedError.statusCode === 401 || normalizedError.statusCode === 403) {
      clearSession();
    }
  }, [clearSession, meQuery.error, meQuery.isError]);

  const isCheckingAuth =
    !hasHydrated ||
    isRefreshing ||
    (shouldFetchCurrentUser && meQuery.isPending);

  const authError = meQuery.isError ? meQuery.error : null;

  const isAuthenticated = Boolean(accessToken && currentUser);

  return {
    accessToken,
    currentUser,
    hasHydrated,
    isAuthenticated,
    isCheckingAuth,
    authError,
  };
}
