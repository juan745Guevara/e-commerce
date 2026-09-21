/**
 * Culqi Checkout v4: https://docs.culqi.com/es/documentacion/checkout/v4
 *
 * El widget de Culqi captura la tarjeta en su propio formulario (nunca pasa
 * por nuestros inputs ni por nuestro backend) y nos devuelve un token vía el
 * callback global `culqi()`. Ese token es lo único que mandamos a
 * `/pagos/charge` — el backend ya está construido para recibir justo eso.
 */
export const CULQI_SCRIPT_SRC = "https://checkout.culqi.com/js/v4";

export type CulqiToken = { id: string };
export type CulqiError = {
  user_message?: string;
  merchant_message?: string;
};

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      token?: CulqiToken;
      error?: CulqiError;
      settings: (options: {
        title: string;
        currency: string;
        amount: number;
        description?: string;
      }) => void;
      open: () => void;
      close: () => void;
    };
    culqi?: () => void;
  }
}

/**
 * Solo devuelve true si el storefront tiene una llave pública de Culqi
 * configurada Y el proveedor activo (espejo de PAYMENT_PROVIDER del
 * backend) es "culqi". MercadoPago todavía no tiene widget propio en el
 * storefront, así que aunque esté seleccionado como proveedor se trata
 * como no disponible hasta que se implemente.
 */
export function isCulqiCheckoutAvailable(): boolean {
  return (
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === "culqi" &&
    Boolean(process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY)
  );
}

export function culqiAmountInCents(total: number): number {
  return Math.round(total * 100);
}

export function culqiCurrency(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_CURRENCY ?? "PEN";
}
