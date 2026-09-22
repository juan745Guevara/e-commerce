"use client";

import { useEffect, useRef, useState } from "react";
import { browserApi } from "@/lib/api/browser";
import type { Order } from "@/lib/api/types";
import {
  CULQI_SCRIPT_SRC,
  culqiAmountInCents,
  culqiCurrency,
  isCulqiCheckoutAvailable,
} from "./culqi";

export const paymentAvailable = isCulqiCheckoutAvailable();

/**
 * Un solo lugar para "abrir Culqi y cobrar un pedido". Antes esta lógica
 * vivía entera dentro de CheckoutView; la sacamos a un hook para poder
 * pagar tanto el pedido recién creado (checkout) como cualquier pedido
 * PENDIENTE que quedó a medias (la lista de "Mis pedidos"), sin repetir
 * la carga del script ni el callback de Culqi en cada lugar.
 */
export function useCulqiCheckout(onPaid: (order: Order) => void) {
  const [culqiReady, setCulqiReady] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!paymentAvailable) {
      return;
    }

    async function charge(orderId: string, tokenId: string) {
      try {
        const result = await browserApi.charge(orderId, tokenId);
        onPaid(result.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cobrar");
      } finally {
        setPayingOrderId(null);
        activeOrderIdRef.current = null;
      }
    }

    window.culqi = () => {
      const orderId = activeOrderIdRef.current;
      if (!orderId) {
        return;
      }
      if (window.Culqi?.token) {
        const tokenId = window.Culqi.token.id;
        window.Culqi.close();
        void charge(orderId, tokenId);
        return;
      }
      if (window.Culqi?.error) {
        setError(
          window.Culqi.error.user_message ?? "No se pudo procesar la tarjeta",
        );
        setPayingOrderId(null);
        activeOrderIdRef.current = null;
      }
    };

    const markCulqiReady = () => {
      if (!window.Culqi) return;
      window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? "";
      setCulqiReady(true);
    };

    if (document.querySelector(`script[src="${CULQI_SCRIPT_SRC}"]`)) {
      markCulqiReady();
    } else {
      const script = document.createElement("script");
      script.src = CULQI_SCRIPT_SRC;
      script.async = true;
      script.onload = markCulqiReady;
      document.body.appendChild(script);
    }

    return () => {
      window.culqi = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function open(order: Order) {
    if (!window.Culqi) {
      return;
    }
    setError(null);
    activeOrderIdRef.current = order.id;
    setPayingOrderId(order.id);
    window.Culqi.settings({
      title: "Atelier",
      currency: culqiCurrency(),
      amount: culqiAmountInCents(order.total),
      description: `Pedido ${order.id}`,
    });
    window.Culqi.open();
  }

  return { paymentAvailable, culqiReady, payingOrderId, error, open };
}
