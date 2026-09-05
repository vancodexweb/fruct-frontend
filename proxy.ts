import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, baseCookieOptions, buildSessionCookies } from "@/lib/auth/cookie-options";
import { backendRefresh } from "@/lib/auth/backend";
import { decodeJwt, isExpired } from "@/lib/auth/jwt";
import type { AccessTokenPayload } from "@/types/auth";

/** Route prefixes only an OWNER may open — a MANAGER hitting one of these is bounced to /403. */
const OWNER_ONLY_PREFIXES = ["/analytics", "/payouts", "/managers"];

function isOwnerOnlyPath(pathname: string): boolean {
  return OWNER_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") {
    url.searchParams.set("next", request.nextUrl.pathname);
  }
  const response = NextResponse.redirect(url);
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

function applySessionCookies(response: NextResponse, accessToken: string, refreshToken: string): void {
  for (const cookie of buildSessionCookies({ accessToken, refreshToken })) {
    response.cookies.set(cookie.name, cookie.value, { ...baseCookieOptions(), maxAge: cookie.maxAge });
  }
}

/**
 * Protects every page route: redirects unauthenticated visitors to /login,
 * transparently rotates an expired access token using the refresh cookie,
 * and enforces OWNER-only sections. Runs on every request except static
 * assets, /api/* (Route Handlers check auth themselves), /login and /403.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const payload = access ? decodeJwt<AccessTokenPayload>(access) : null;
    if (payload && !isExpired(payload.exp)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/403") {
    return NextResponse.next();
  }

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let payload = accessToken ? decodeJwt<AccessTokenPayload>(accessToken) : null;
  let refreshedResponse: NextResponse | null = null;

  if (!accessToken || !payload || isExpired(payload.exp)) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
      return redirectToLogin(request);
    }
    try {
      const tokens = await backendRefresh(refreshToken);
      accessToken = tokens.accessToken;
      payload = decodeJwt<AccessTokenPayload>(accessToken);
      if (!payload) throw new Error("Не удалось разобрать обновлённый токен.");
      refreshedResponse = NextResponse.next();
      applySessionCookies(refreshedResponse, tokens.accessToken, tokens.refreshToken);
    } catch {
      return redirectToLogin(request);
    }
  }

  if (isOwnerOnlyPath(pathname) && payload.role !== "OWNER") {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return refreshedResponse ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
