/**
 * Server-only session helpers for Route Handlers and Server Components.
 * `cookies()` can only be *written* from a Route Handler or Server Function,
 * so `getValidAccessToken` (which may refresh and re-set cookies) must only
 * be called from a Route Handler — see app/api/proxy/[...path]/route.ts.
 */
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, baseCookieOptions, buildSessionCookies } from "./cookie-options";
import { backendRefresh } from "./backend";
import { decodeJwt, isExpired } from "./jwt";
import type { AccessTokenPayload, AuthTokens, SessionUser } from "@/types/auth";

export async function setSessionCookies(tokens: AuthTokens): Promise<void> {
  const store = await cookies();
  for (const cookie of buildSessionCookies(tokens)) {
    store.set(cookie.name, cookie.value, { ...baseCookieOptions(), maxAge: cookie.maxAge });
  }
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value;
}

/** Decodes whatever access token is currently in the cookie jar — does not refresh. For UI/routing display only. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const payload = access ? decodeJwt<AccessTokenPayload>(access) : null;
  if (!payload) return null;
  return { id: payload.sub, tenantId: payload.tenantId, role: payload.role, email: payload.email };
}

/**
 * Read-only: whatever access token is currently in the cookie jar, with no
 * refresh attempt. Safe to call from a Server Component (which cannot write
 * cookies) — relies on proxy.ts having already refreshed it for this
 * navigation. Use `getValidAccessToken` instead from a Route Handler.
 */
export async function getAccessTokenReadOnly(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Returns a currently-valid access token, transparently refreshing (and
 * persisting the new pair) if the current one is missing or expired. Only
 * callable from a Route Handler — it writes cookies.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const store = await cookies();
  const access = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const payload = access ? decodeJwt<AccessTokenPayload>(access) : null;
  if (access && payload && !isExpired(payload.exp)) {
    return access;
  }

  const refresh = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refresh) return null;

  try {
    const tokens = await backendRefresh(refresh);
    await setSessionCookies(tokens);
    return tokens.accessToken;
  } catch {
    await clearSessionCookies();
    return null;
  }
}
