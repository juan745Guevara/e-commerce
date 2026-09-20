"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";
import type { Cart } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";

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
      <p>
        <Link href="/login?next=/carrito" className="underline">
          Inicia sesión
        </Link>{" "}
        para ver tu carrito.
      </p>
    );
  }

  if (error) {
    return <p className="text-rust">{error}</p>;
  }

  if (!cart) {
    return <p>Cargando carrito…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <p>
        Tu carrito está vacío.{" "}
        <Link href="/catalogo" className="underline">
          Ir al catálogo
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
          >
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-sm text-ink/60">
                {formatMoney(item.unitPrice)} · stock {item.stock}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={item.stock}
                defaultValue={item.quantity}
                className="w-20 rounded-lg border border-ink/15 px-2 py-1"
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
              <button
                type="button"
                className="text-sm text-rust underline"
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
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-lg font-medium">Total {formatMoney(cart.total)}</p>
        <Link
          href="/checkout"
          className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream"
        >
          Ir a pagar
        </Link>
      </div>
    </div>
  );
}
