import { NextResponse } from "next/server";
import { BackendAuthError, backendLogin } from "@/lib/auth/backend";
import { setSessionCookies } from "@/lib/auth/session.server";
import { decodeJwt } from "@/lib/auth/jwt";
import type { AccessTokenPayload, LoginDto } from "@/types/auth";

export async function POST(request: Request): Promise<NextResponse> {
  let dto: Partial<LoginDto>;
  try {
    dto = (await request.json()) as Partial<LoginDto>;
  } catch {
    return NextResponse.json({ statusCode: 400, message: "Некорректное тело запроса." }, { status: 400 });
  }

  if (!dto.email || !dto.password) {
    return NextResponse.json(
      { statusCode: 400, message: "Укажите email и пароль." },
      { status: 400 },
    );
  }

  try {
    const tokens = await backendLogin({ email: dto.email, password: dto.password });
    await setSessionCookies(tokens);
    const payload = decodeJwt<AccessTokenPayload>(tokens.accessToken);
    return NextResponse.json({ role: payload?.role ?? null, email: payload?.email ?? dto.email });
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return NextResponse.json({ statusCode: error.status, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ statusCode: 502, message: "Backend недоступен." }, { status: 502 });
  }
}
