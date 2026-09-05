import type { Role } from "./users";

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Claims embedded in a signed access token (src/common/types/jwt-payload.type.ts on the backend). */
export interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  role: Role;
  email: string;
  iat: number;
  exp: number;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface SessionUser {
  id: string;
  tenantId: string;
  role: Role;
  email: string;
}
