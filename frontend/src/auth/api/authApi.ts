import { http } from "@/shared/api/http";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

type TokenResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: AuthUser;
  data?: unknown;
};

function normalizeAccessToken(data: TokenResponse): string | null {
  return data.accessToken ?? data.access_token ?? data.token ?? null;
}

export async function login(input: LoginInput) {
  const res = await http.post<TokenResponse>("/auth/login", input);
  const accessToken =
    normalizeAccessToken(res.data) ||
    (res.data.data && typeof res.data.data === "object"
      ? normalizeAccessToken(res.data.data as TokenResponse)
      : null);
  if (!accessToken) throw new Error("Missing access token from /auth/login response");
  return { accessToken, user: res.data.user ?? null };
}

export async function register(input: RegisterInput) {
  const res = await http.post<TokenResponse>("/auth/register", input);
  const accessToken =
    normalizeAccessToken(res.data) ||
    (res.data.data && typeof res.data.data === "object"
      ? normalizeAccessToken(res.data.data as TokenResponse)
      : null);
  if (!accessToken) throw new Error("Missing access token from /auth/register response");
  return { accessToken, user: res.data.user ?? null };
}

export async function me(accessToken?: string) {
  const res = await http.get<unknown>("/auth/me", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (res.data && typeof res.data === "object") {
    const maybeUser = (res.data as { user?: unknown }).user;
    if (maybeUser && typeof maybeUser === "object") return maybeUser as AuthUser;
  }
  return res.data as AuthUser;
}
