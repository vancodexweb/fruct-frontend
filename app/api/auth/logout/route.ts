import { NextResponse } from "next/server";
import { backendLogout } from "@/lib/auth/backend";
import { clearSessionCookies, getRefreshToken } from "@/lib/auth/session.server";

export async function POST(): Promise<NextResponse> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await backendLogout(refreshToken);
  }
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
