import { NextResponse, type NextRequest } from "next/server";
import { getValidAccessToken } from "@/lib/auth/session.server";

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

/**
 * Every client-side (React Query) request to the backend goes through here.
 * This is the only place the browser's session cookie ever gets exchanged
 * for a Bearer token — the token itself never reaches client JS.
 */
async function handle(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { path } = await params;
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ statusCode: 401, message: "Требуется вход в систему." }, { status: 401 });
  }

  const targetUrl = new URL(`${API_URL}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  };

  if (METHODS_WITH_BODY.has(request.method)) {
    const body = await request.text();
    if (body) {
      init.body = body;
    }
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, init);
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "Не удалось связаться с сервером. Попробуйте позже." },
      { status: 502 },
    );
  }

  const text = await backendRes.text();
  return new NextResponse(text.length > 0 ? text : null, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
