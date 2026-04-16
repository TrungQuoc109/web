import type { Role } from "@/shared/types/workspace";

export type AuthenticatedUser = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export type UpdateProfilePayload = {
  email?: string;
  name?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type LoginResponse = {
  accessToken: string;
  user?: AuthenticatedUser | null;
};

export type RegisterResponse = AuthenticatedUser;

export type LoginDto = LoginPayload;
export type RegisterDto = RegisterPayload;
export type UpdateProfileDto = UpdateProfilePayload;
export type ChangePasswordDto = ChangePasswordPayload;
