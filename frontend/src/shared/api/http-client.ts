import axios, { AxiosHeaders } from "axios";

import { refreshAuthSessionRequest } from "@/auth/api/refreshApi";
import { authStore } from "@/auth/store/authStore";
import { getCurrentTranslation } from "@/i18n/useI18n";
import { env } from "@/shared/config/env";
import { normalizeApiError } from "@/shared/api/normalizeApiError";
import { showErrorToast } from "@/shared/lib/toast-store";

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
let refreshPromise: Promise<string | null> | null = null;

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  const headers = AxiosHeaders.from(config.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const normalizedError = normalizeApiError(error);
    const requestUrl = error.config?.url ?? "";
    const headers = AxiosHeaders.from(error.config?.headers);
    const hasAuthHeader = headers.has("Authorization");
    const hasStoredToken = Boolean(authStore.getState().accessToken);
    const isAuthRequest = AUTH_ROUTES.some((route) => requestUrl.includes(route));
    const shouldHandleUnauthorized =
      normalizedError.isUnauthorized &&
      !isAuthRequest &&
      (hasAuthHeader || hasStoredToken);

    if (shouldHandleUnauthorized && !error.config?._retry) {
      error.config._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAuthSessionRequest().then((session) => {
            authStore.getState().setSession({
              accessToken: session.accessToken,
              currentUser: session.user ?? authStore.getState().currentUser,
            });

            return session.accessToken;
          });
        }

        const nextAccessToken = await refreshPromise;
        refreshPromise = null;

        if (nextAccessToken) {
          const retryHeaders = AxiosHeaders.from(error.config?.headers);
          retryHeaders.set("Authorization", `Bearer ${nextAccessToken}`);
          error.config.headers = retryHeaders;
          return httpClient.request(error.config);
        }
      } catch {
        refreshPromise = null;
      }
    }

    if (shouldHandleUnauthorized) {
      authStore.getState().clearSession();
      showErrorToast(
        getCurrentTranslation("toast.sessionExpiredDescription"),
        getCurrentTranslation("toast.sessionExpiredTitle")
      );
    }

    if (normalizedError.isNetworkError) {
      showErrorToast(
        normalizedError.message,
        getCurrentTranslation("toast.networkErrorTitle")
      );
    }

    return Promise.reject(error);
  }
);
