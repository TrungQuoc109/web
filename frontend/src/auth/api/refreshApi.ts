import axios from "axios";

import type { LoginResponse } from "@/auth/types/auth";
import { env } from "@/shared/config/env";

type RefreshAuthResponseShape = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: unknown;
  data?: unknown;
};

function normalizeAccessToken(data: RefreshAuthResponseShape) {
  return data.accessToken ?? data.access_token ?? null;
}

function normalizeRefreshToken(data: RefreshAuthResponseShape) {
  return data.refreshToken ?? data.refresh_token ?? null;
}

export async function refreshAuthSessionRequest(
): Promise<LoginResponse> {
  const response = await axios.post<RefreshAuthResponseShape>(
    `${env.apiUrl}/auth/refresh`,
    {},
    {
      timeout: 15_000,
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const accessToken = normalizeAccessToken(response.data);
  const rotatedRefreshToken = normalizeRefreshToken(response.data);

  if (!accessToken) {
    throw new Error("Invalid /auth/refresh response");
  }

  return {
    accessToken,
    refreshToken: rotatedRefreshToken ?? "",
    user:
      (response.data.user as LoginResponse["user"]) ??
      (response.data.data as LoginResponse["user"]) ??
      null,
  };
}
