import { httpClient } from "@/shared/api/http-client";
import type {
  ChangePasswordPayload,
  AuthenticatedUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  UpdateProfilePayload,
} from "@/auth/types/auth";
import type { Role } from "@/shared/types/workspace";

type AuthResponseShape = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: unknown;
  data?: unknown;
};

type AuthUserShape = {
  id?: unknown;
  email?: unknown;
  name?: unknown;
  role?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  user?: unknown;
};

const roles: Role[] = ["ADMIN", "MANAGER", "MEMBER"];

function normalizeAccessToken(data: AuthResponseShape): string | null {
  return data.accessToken ?? data.access_token ?? data.token ?? null;
}

function normalizeUser(data: unknown): AuthenticatedUser | null {
  if (!data || typeof data !== "object") return null;

  const directUser = data as AuthUserShape;
  if (directUser.user) {
    return normalizeUser(directUser.user);
  }

  const id =
    typeof directUser.id === "number"
      ? directUser.id
      : typeof directUser.id === "string" && directUser.id.trim()
        ? Number(directUser.id)
        : NaN;

  const role = roles.find((candidate) => candidate === directUser.role);

  if (
    Number.isFinite(id) &&
    typeof directUser.email === "string" &&
    typeof role === "string"
  ) {
    return {
      id,
      email: directUser.email,
      name: typeof directUser.name === "string" ? directUser.name : null,
      role,
      createdAt:
        typeof directUser.createdAt === "string" ? directUser.createdAt : undefined,
      updatedAt:
        typeof directUser.updatedAt === "string" ? directUser.updatedAt : undefined,
    };
  }

  return null;
}

export async function login(input: LoginPayload): Promise<LoginResponse> {
  const res = await httpClient.post<AuthResponseShape>("/auth/login", input);
  const accessToken =
    normalizeAccessToken(res.data) ||
    (res.data.data && typeof res.data.data === "object"
      ? normalizeAccessToken(res.data.data as AuthResponseShape)
      : null);
  if (!accessToken) {
    throw new Error("Missing access token from /auth/login response");
  }

  return {
    accessToken,
    user: normalizeUser(res.data.user) ?? normalizeUser(res.data.data),
  };
}

export async function register(input: RegisterPayload): Promise<RegisterResponse> {
  const res = await httpClient.post<AuthResponseShape>("/auth/register", input);
  const user = normalizeUser(res.data) ?? normalizeUser(res.data.data);
  if (!user) {
    throw new Error("Invalid /auth/register response");
  }

  return user;
}

export async function getMe(accessToken?: string): Promise<AuthenticatedUser> {
  const res = await httpClient.get<unknown>("/auth/me", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  const user = normalizeUser(res.data);
  if (!user) {
    throw new Error("Invalid /auth/me response");
  }

  return user;
}

export async function updateProfile(
  input: UpdateProfilePayload
): Promise<AuthenticatedUser> {
  const res = await httpClient.patch<unknown>("/auth/me", input);
  const user = normalizeUser(res.data);
  if (!user) {
    throw new Error("Invalid /auth/me PATCH response");
  }

  return user;
}

export async function changePassword(
  input: ChangePasswordPayload
): Promise<{ message: string }> {
  const res = await httpClient.patch<{ message?: unknown }>("/auth/password", input);
  const message =
    typeof res.data?.message === "string"
      ? res.data.message
      : "Password updated successfully.";

  return { message };
}

export const me = getMe;
