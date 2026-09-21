"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ApiError } from "@/lib/api/client";
import { browserApi } from "@/lib/api/browser";
import { notifyCartChanged } from "@/lib/cart/cart-events";
import { useCulqiCheckout } from "@/lib/payments/use-culqi-checkout";
import type { Order } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";

export function CheckoutView() {
  const [order, setOrder] = useState<Order | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const {
    paymentAvailable,
    culqiReady,
    payingOrderId,
    error: payError,
    open: openCulqi,
  } = useCulqiCheckout(setOrder);

  useEffect(() => {
    void (async () => {
      try {
        const cart = await browserApi.getCart();
        if (cart.items.length === 0) {
          setPlaceError("El carrito está vacío");
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
    setPlaceError(null);
    try {
      const created = await browserApi.checkout();
      setOrder(created);
      // El checkout vacía el carrito en el backend; avisamos para que el
      // contador del header baje a 0 sin esperar un refresh manual.
      notifyCartChanged();
    } catch (err) {
      setPlaceError(
        err instanceof Error ? err.message : "No se pudo crear el pedido",
      );
    } finally {
      setPending(false);
    }
  }

  if (order) {
    const isPaying = payingOrderId === order.id;

    return (
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-6">
        <p className="text-sm text-muted">
          Pedido <span className="font-mono">{order.id}</span>
        </p>
        <p className="text-[15px]">
          Estado: <strong>{order.status}</strong> · {formatMoney(order.total)}
        </p>
        {order.status === "PENDIENTE" ? (
          paymentAvailable ? (
            <div className="flex flex-col gap-3">
              {payError ? <p className="text-sm text-red-600">{payError}</p> : null}
              <motion.button
                type="button"
                onClick={() => openCulqi(order)}
                disabled={isPaying || !culqiReady}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="btn-pill py-3"
              >
                {isPaying
                  ? "Cobrando…"
                  : culqiReady
                    ? "Pagar con tarjeta"
                    : "Cargando pasarela…"}
              </motion.button>
              <p className="text-xs text-muted">
                Se abre el formulario seguro de Culqi. Tu tarjeta nunca pasa
                por nuestros servidores.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl bg-background p-4">
              <p className="text-[15px] font-medium">Pago no disponible</p>
              <p className="text-sm text-muted">
                Todavía no configuramos una pasarela de pago para esta tienda.
                Tu pedido quedó guardado como <strong>PENDIENTE</strong> — puedes
                pagarlo más tarde desde{" "}
                <Link href="/pedidos" className="text-accent hover:underline">
                  Mis pedidos
                </Link>{" "}
                en cuanto esté disponible.
              </p>
            </div>
          )
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
      {placeError ? <p className="text-red-600">{placeError}</p> : null}
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
