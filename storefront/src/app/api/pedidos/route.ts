import { NextResponse } from "next/server";
import { createBackendClient } from "@/lib/api/server";
import { jsonError } from "@/lib/api/http";
import { getAccessToken } from "@/lib/auth/session";

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const orders = await createBackendClient(token).listMyOrders();
    return NextResponse.json(orders);
  } catch (error) {
    return jsonError(error);
  }
}
