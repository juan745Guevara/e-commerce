"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";
import { useCulqiCheckout } from "@/lib/payments/use-culqi-checkout";
import type { Order, OrderStatus } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";
import { OrderTimeline } from "./order-timeline";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  PAGADO: "bg-blue-100 text-blue-800",
  ENVIADO: "bg-indigo-100 text-indigo-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    paymentAvailable,
    culqiReady,
    payingOrderId,
    error: payError,
    open: openCulqi,
  } = useCulqiCheckout((updated) => {
    setOrders((current) =>
      current?.map((order) => (order.id === updated.id ? updated : order)) ??
      current,
    );
  });

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
      <p className="text-body">
        <Link href="/login?next=/pedidos" className="text-accent hover:underline">
          Inicia sesión
        </Link>{" "}
        para ver tus pedidos.
      </p>
    );
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!orders) {
    return <p className="text-body">Cargando pedidos…</p>;
  }

  if (orders.length === 0) {
    return <p className="text-body">Aún no tienes pedidos.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-line rounded-3xl bg-surface px-5">
      {orders.map((order) => {
        const isPaying = payingOrderId === order.id;

        return (
          <li key={order.id} className="flex flex-col gap-4 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted">{order.id}</p>
                <p className="mt-1 text-[15px] font-medium">
                  {formatMoney(order.total)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
              >
                {order.status}
              </span>
            </div>
            <OrderTimeline status={order.status} />
            {order.status === "PENDIENTE" ? (
              <div className="flex flex-col gap-2 border-t border-line pt-4">
                {paymentAvailable ? (
                  <>
                    {isPaying && payError ? (
                      <p className="text-xs text-red-600">{payError}</p>
                    ) : null}
                    <motion.button
                      type="button"
                      onClick={() => openCulqi(order)}
                      disabled={!culqiReady || (payingOrderId !== null && !isPaying)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                      className="btn-pill w-fit px-6 py-2 text-sm"
                    >
                      {isPaying
                        ? "Cobrando…"
                        : culqiReady
                          ? "Pagar ahora"
                          : "Cargando pasarela…"}
                    </motion.button>
                  </>
                ) : (
                  <p className="text-xs text-muted">
                    Pago no disponible por ahora — te avisaremos cuando puedas
                    pagar este pedido.
                  </p>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
