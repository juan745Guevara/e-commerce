"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";
import { notifyCartChanged } from "@/lib/cart/cart-events";

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
      notifyCartChanged();
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
      <motion.button
        type="button"
        onClick={() => void add()}
        disabled={disabled || pending}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="btn-pill w-full py-3"
      >
        {pending ? "Agregando…" : "Agregar al carrito"}
      </motion.button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
