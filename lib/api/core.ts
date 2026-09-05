import type { ApiErrorBody } from "@/types/common";

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "ApiError";
  }
}

export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const body = data as ApiErrorBody | undefined;
    const messages = body && Array.isArray(body.message) ? body.message : undefined;
    const message = messages
      ? messages.join("; ")
      : body && typeof body.message === "string"
        ? body.message
        : res.statusText || "Ошибка запроса";
    throw new ApiError(res.status, message, messages);
  }

  return data as T;
}

/**
 * Builds a `?a=1&b=2` query string, dropping undefined/null/empty-string
 * values. Takes `object` rather than an indexed record so any of the
 * concrete `*Query` DTO interfaces can be passed directly, with no index
 * signature required on each of them.
 */
export function toQueryString(params?: object): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/**
 * A read function's fetch strategy is injected rather than hardcoded so the
 * same function serves a Server Component's initial fetch (`serverApiFetch`)
 * and a React Query hook's client-side fetch (`clientApiFetch`).
 */
export type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;
