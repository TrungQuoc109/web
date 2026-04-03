export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}
