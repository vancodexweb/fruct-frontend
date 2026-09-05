/** Server Components' fetcher: calls the backend directly with the session's access token. Never import from a Client Component. */
import { getAccessTokenReadOnly } from "@/lib/auth/session.server";
import { parseJsonResponse } from "./core";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export async function serverApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessTokenReadOnly();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  return parseJsonResponse<T>(res);
}
