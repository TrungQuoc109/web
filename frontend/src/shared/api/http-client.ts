import axios, { AxiosHeaders } from "axios";

import { authStore } from "@/auth/store/authStore";
import { env } from "@/shared/config/env";
import { normalizeApiError } from "@/shared/api/normalizeApiError";
import { getAccessToken, removeAccessToken } from "@/shared/lib/token-storage";
import { showErrorToast } from "@/shared/lib/toast-store";

const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken() ?? authStore.getState().accessToken;
  const headers = AxiosHeaders.from(config.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeApiError(error);
    const requestUrl = error.config?.url ?? "";
    const headers = AxiosHeaders.from(error.config?.headers);
    const hasAuthHeader = headers.has("Authorization");
    const hasStoredToken = Boolean(getAccessToken() ?? authStore.getState().accessToken);
    const isAuthRequest = AUTH_ROUTES.some((route) => requestUrl.includes(route));
    const shouldHandleUnauthorized =
      normalizedError.isUnauthorized &&
      !isAuthRequest &&
      (hasAuthHeader || hasStoredToken);

    if (shouldHandleUnauthorized) {
      removeAccessToken();
      authStore.getState().clearSession();
      showErrorToast("Your session has expired. Please sign in again.", "Unauthorized");
    }

    if (normalizedError.isNetworkError) {
      showErrorToast(normalizedError.message, "Network error");
    }

    return Promise.reject(error);
  }
);
