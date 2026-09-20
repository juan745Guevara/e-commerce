import { NextResponse } from "next/server";
import { createBackendClient } from "@/lib/api/server";
import { jsonError } from "@/lib/api/http";
import { getAccessToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as { orderId: string; token: string };
    const result = await createBackendClient(token).charge(
      body.orderId,
      body.token,
    );
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
