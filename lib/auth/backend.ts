/**
 * Direct calls to the NestJS backend's public auth endpoints. Used only from
 * Route Handlers and proxy.ts (never from the browser) — this is the one
 * place the frontend talks to the backend without an Authorization header,
 * because these three endpoints are exactly the ones that don't need one.
 */
import type { ApiErrorBody } from "@/types/common";
import type { AuthTokens, LoginDto } from "@/types/auth";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export class BackendAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "BackendAuthError";
  }
}

function extractMessage(body: ApiErrorBody | null, fallback: string): string {
  if (!body) return fallback;
  if (Array.isArray(body.message)) return body.message.join("; ");
  return body.message || fallback;
}

async function postAuth(path: string, payload: unknown): Promise<AuthTokens> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new BackendAuthError(502, "Не удалось связаться с сервером. Попробуйте позже.");
  }

  const text = await res.text();
  const body = text ? (JSON.parse(text) as ApiErrorBody) : null;

  if (!res.ok) {
    throw new BackendAuthError(res.status, extractMessage(body, "Ошибка авторизации."));
  }
  return body as unknown as AuthTokens;
}

export function backendLogin(dto: LoginDto): Promise<AuthTokens> {
  return postAuth("/auth/login", dto);
}

export function backendRefresh(refreshToken: string): Promise<AuthTokens> {
  return postAuth("/auth/refresh", { refreshToken });
}

export async function backendLogout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    // Logout is best-effort client-side too — cookies are cleared regardless.
  }
}
