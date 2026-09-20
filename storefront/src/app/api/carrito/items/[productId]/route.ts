import { NextResponse } from "next/server";
import { createBackendClient } from "@/lib/api/server";
import { jsonError } from "@/lib/api/http";
import { getAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ productId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { productId } = await context.params;
    const body = (await request.json()) as { quantity: number };
    const cart = await createBackendClient(token).updateCartItem(
      productId,
      body.quantity,
    );
    return NextResponse.json(cart);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { productId } = await context.params;
    const cart = await createBackendClient(token).removeCartItem(productId);
    return NextResponse.json(cart);
  } catch (error) {
    return jsonError(error);
  }
}
