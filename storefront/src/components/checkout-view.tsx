"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";
import type { Order } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";

export function CheckoutView() {
  const [order, setOrder] = useState<Order | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const cart = await browserApi.getCart();
        if (cart.items.length === 0) {
          setError("El carrito está vacío");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setUnauthorized(true);
        }
      }
    })();
  }, []);

  if (unauthorized) {
    return (
      <p className="text-body">
        <Link href="/login?next=/checkout" className="text-accent hover:underline">
          Inicia sesión
        </Link>{" "}
        para continuar.
      </p>
    );
  }

  async function placeOrder() {
    setPending(true);
    setError(null);
    try {
      const created = await browserApi.checkout();
      setOrder(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido");
    } finally {
      setPending(false);
    }
  }

  async function pay() {
    if (!order) return;
    setPending(true);
    setError(null);
    try {
      const result = await browserApi.charge(order.id, token);
      setOrder(result.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cobrar");
    } finally {
      setPending(false);
    }
  }

  if (order) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-6">
        <p className="text-sm text-muted">
          Pedido <span className="font-mono">{order.id}</span>
        </p>
        <p className="text-[15px]">
          Estado: <strong>{order.status}</strong> · {formatMoney(order.total)}
        </p>
        {order.status === "PENDIENTE" ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void pay();
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              Token de la pasarela (Culqi / MercadoPago)
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                className="rounded-xl border border-line bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <motion.button
              type="submit"
              disabled={pending}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="btn-pill py-3"
            >
              {pending ? "Cobrando…" : "Confirmar pago"}
            </motion.button>
          </form>
        ) : (
          <Link href="/pedidos" className="text-accent hover:underline">
            Ver mis pedidos
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-red-600">{error}</p> : null}
      <motion.button
        type="button"
        onClick={() => void placeOrder()}
        disabled={pending}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="btn-pill py-3"
      >
        {pending ? "Creando pedido…" : "Confirmar pedido"}
      </motion.button>
    </div>
  );
}
