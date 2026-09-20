import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      typeof error.body === "object" && error.body !== null
        ? error.body
        : { message: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { message: "Error interno del storefront" },
    { status: 500 },
  );
}
