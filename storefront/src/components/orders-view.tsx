"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";
import type { Order } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";

export function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setOrders(await browserApi.listMyOrders());
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError("auth");
          return;
        }
        setError(err instanceof Error ? err.message : "Error al cargar pedidos");
      }
    })();
  }, []);

  if (error === "auth") {
    return (
      <p>
        <Link href="/login?next=/pedidos" className="underline">
          Inicia sesión
        </Link>{" "}
        para ver tus pedidos.
      </p>
    );
  }

  if (error) {
    return <p className="text-rust">{error}</p>;
  }

  if (!orders) {
    return <p>Cargando pedidos…</p>;
  }

  if (orders.length === 0) {
    return <p>Aún no tienes pedidos.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-4"
        >
          <p className="font-mono text-xs text-ink/50">{order.id}</p>
          <p className="mt-1">
            {order.status} · {formatMoney(order.total)}
          </p>
        </li>
      ))}
    </ul>
  );
}
