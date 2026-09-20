"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
      <p>
        <Link href="/login?next=/checkout" className="underline">
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
      <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-6">
        <p>
          Pedido <span className="font-mono text-sm">{order.id}</span>
        </p>
        <p>
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
                className="rounded-xl border border-ink/15 px-3 py-2 font-mono text-sm"
              />
            </label>
            {error ? <p className="text-sm text-rust">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50"
            >
              {pending ? "Cobrando…" : "Confirmar pago"}
            </button>
          </form>
        ) : (
          <Link href="/pedidos" className="underline">
            Ver mis pedidos
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-rust">{error}</p> : null}
      <button
        type="button"
        onClick={() => void placeOrder()}
        disabled={pending}
        className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50"
      >
        {pending ? "Creando pedido…" : "Confirmar pedido"}
      </button>
    </div>
  );
}
