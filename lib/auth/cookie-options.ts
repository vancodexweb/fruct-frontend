import { decodeJwt } from "./jwt";
import type { AuthTokens } from "@/types/auth";

/** httpOnly session cookies — never readable from client-side JS, only from Route Handlers/proxy.ts. */
export const ACCESS_TOKEN_COOKIE = "fruct_access_token";
export const REFRESH_TOKEN_COOKIE = "fruct_refresh_token";

export interface CookieDescriptor {
  name: string;
  value: string;
  maxAge: number;
}

const FALLBACK_ACCESS_TTL_SECONDS = 15 * 60;
const FALLBACK_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Cookie lifetime mirrors each token's own `exp` claim so a cookie never outlives the JWT inside it. */
export function buildSessionCookies(tokens: AuthTokens): CookieDescriptor[] {
  const now = Math.floor(Date.now() / 1000);
  const access = decodeJwt<{ exp: number }>(tokens.accessToken);
  const refresh = decodeJwt<{ exp: number }>(tokens.refreshToken);

  return [
    {
      name: ACCESS_TOKEN_COOKIE,
      value: tokens.accessToken,
      maxAge: Math.max((access?.exp ?? now + FALLBACK_ACCESS_TTL_SECONDS) - now, 60),
    },
    {
      name: REFRESH_TOKEN_COOKIE,
      value: tokens.refreshToken,
      maxAge: Math.max((refresh?.exp ?? now + FALLBACK_REFRESH_TTL_SECONDS) - now, 60),
    },
  ];
}

export function baseCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
