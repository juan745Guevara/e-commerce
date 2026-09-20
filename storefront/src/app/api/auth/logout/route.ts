import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
