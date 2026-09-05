"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@/types/auth";

const SessionContext = createContext<SessionUser | null>(null);

/** Hydrates client components with the session decoded server-side in app/(app)/layout.tsx — no extra request needed just to know the current user's role. */
export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionUser {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession должен использоваться внутри SessionProvider");
  }
  return ctx;
}
