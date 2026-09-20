import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./cookies";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const id = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const role = typeof payload.role === "string" ? payload.role : null;
    if (!id || !email || !role) {
      return null;
    }
    return { id, email, role };
  } catch {
    return null;
  }
}
