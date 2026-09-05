/** Client Components' fetcher: always same-origin, through /api/proxy — the browser never holds or sees the access token. */
import { parseJsonResponse } from "./core";

export async function clientApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (res.status === 401 && typeof window !== "undefined") {
    // A full reload (not router.push) is deliberate: this runs from a plain
    // fetch helper with no access to useRouter, and a dead session means all
    // client-held React Query cache/app state needs to be dropped anyway.
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${next}`;
  }

  return parseJsonResponse<T>(res);
}
