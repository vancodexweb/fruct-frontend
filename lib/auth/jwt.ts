/**
 * Decodes a JWT payload without verifying its signature. Safe here because
 * the token's authenticity is verified backend-side on every request that
 * uses it (Authorization header) — this decode only drives client-visible
 * routing (which nav items to show, whether to refresh before it expires),
 * never an access-control decision the backend hasn't already made.
 */
export function decodeJwt<T>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** `exp` is a JWT NumericDate (seconds). `skewSeconds` refreshes a little early to avoid racing the backend's own clock. */
export function isExpired(exp: number, skewSeconds = 15): boolean {
  return Date.now() >= (exp - skewSeconds) * 1000;
}
