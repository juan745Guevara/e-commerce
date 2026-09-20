import { NextResponse } from "next/server";
import { createBackendClient } from "@/lib/api/server";
import { jsonError } from "@/lib/api/http";
import { ACCESS_TOKEN_COOKIE, authCookieOptions } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email: string;
      password: string;
      phone?: string;
    };
    const api = createBackendClient();
    await api.register(body);
    const result = await api.login({
      email: body.email,
      password: body.password,
    });
    const response = NextResponse.json({ user: result.user });
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      authCookieOptions,
    );
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
