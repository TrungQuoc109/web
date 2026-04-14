import * as authApi from "@/auth/api/authApi";
import type {
  AuthenticatedUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from "@/auth/types/auth";

type AuthService = {
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  getMe: (accessToken?: string) => Promise<AuthenticatedUser>;
};

export const authService: AuthService = {
  login: authApi.login,
  register: authApi.register,
  getMe: authApi.getMe,
};
