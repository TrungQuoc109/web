import axios from "axios";

import { env } from "@/shared/config/env";
import { authStore } from "@/auth/store/authStore";

export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      authStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
