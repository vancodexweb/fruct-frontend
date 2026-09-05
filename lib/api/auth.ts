import { useMutation } from "@tanstack/react-query";
import type { LoginDto } from "@/types/auth";
import type { ApiErrorBody } from "@/types/common";
import { ApiError } from "./core";

export interface LoginResult {
  role: "OWNER" | "MANAGER" | null;
  email: string;
}

/** Talks to this app's own Route Handlers (never the backend directly) — see app/api/auth/*. */
async function loginRequest(dto: LoginDto): Promise<LoginResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const body = (await res.json()) as LoginResult | ApiErrorBody;
  if (!res.ok) {
    const err = body as ApiErrorBody;
    const message = Array.isArray(err.message) ? err.message.join("; ") : err.message;
    throw new ApiError(res.status, message);
  }
  return body as LoginResult;
}

async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export function useLogin() {
  return useMutation({ mutationFn: loginRequest });
}

export function useLogout() {
  return useMutation({ mutationFn: logoutRequest });
}
