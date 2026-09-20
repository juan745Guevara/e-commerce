"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";
import type { Cart } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";
import { ProductArt } from "./product-art";

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  async function load() {
    try {
      const data = await browserApi.getCart();
      setCart(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUnauthorized(true);
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo cargar el carrito");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (unauthorized) {
    return (
      <p className="text-body">
        <Link href="/login?next=/carrito" className="text-accent hover:underline">
          Inicia sesión
        </Link>{" "}
        para ver tu carrito.
      </p>
    );
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!cart) {
    return <p className="text-body">Cargando carrito…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <p className="text-body">
        Tu bolsa está vacía.{" "}
        <Link href="/catalogo" className="text-accent hover:underline">
          Ir al catálogo
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px] md:items-start">
      <ul className="flex flex-col divide-y divide-line rounded-3xl bg-surface px-5">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-background">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <ProductArt
                  label={item.productName}
                  className="flex h-full w-full items-center justify-center"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[15px] font-medium">{item.productName}</p>
              <p className="text-sm text-muted">{formatMoney(item.unitPrice)}</p>
              <button
                type="button"
                className="mt-1 w-fit text-sm text-accent hover:underline"
                onClick={() => {
                  void browserApi
                    .removeCartItem(item.productId)
                    .then(setCart)
                    .catch((err: unknown) =>
                      setError(
                        err instanceof Error ? err.message : "Error al quitar",
                      ),
                    );
                }}
              >
                Quitar
              </button>
            </div>
            <input
              type="number"
              min={1}
              max={item.stock}
              defaultValue={item.quantity}
              className="w-16 rounded-xl border border-line bg-background px-2 py-1.5 text-center text-sm"
              onBlur={(event) => {
                const quantity = Number(event.target.value);
                if (quantity >= 1) {
                  void browserApi
                    .updateCartItem(item.productId, quantity)
                    .then(setCart)
                    .catch((err: unknown) =>
                      setError(
                        err instanceof Error ? err.message : "Error al actualizar",
                      ),
                    );
                }
              }}
            />
          </li>
        ))}
      </ul>
      <motion.div
        layout
        className="flex flex-col gap-4 rounded-3xl bg-surface p-6"
      >
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="text-foreground">{formatMoney(cart.total)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-4 text-[15px] font-medium">
          <span>Total</span>
          <span>{formatMoney(cart.total)}</span>
        </div>
        <Link href="/checkout" className="btn-pill mt-2 w-full py-3">
          Ir a pagar
        </Link>
      </motion.div>
    </div>
  );
}
