"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function add() {
    setPending(true);
    setMessage(null);
    try {
      await browserApi.addCartItem(productId, 1);
      setMessage("Agregado al carrito");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(`/login?next=/producto/${productId}`);
        return;
      }
      setMessage(error instanceof Error ? error.message : "No se pudo agregar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void add()}
        disabled={disabled || pending}
        className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Agregando…" : "Agregar al carrito"}
      </button>
      {message ? (
        <p className="text-sm text-ink/70">{message}</p>
      ) : null}
    </div>
  );
}
