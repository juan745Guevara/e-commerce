---
id: 3
title: Abstraer la pasarela de pago detrás de IPaymentGateway (Culqi / Mercado Pago intercambiables)
status: aceptada
---
# Contexto

El proyecto necesita cobrar pedidos con una pasarela de pago real. Perú tiene más de una opción viable (Culqi, Mercado Pago) y no había certeza de cuál usar en producción desde el día uno.

# Decisión

`PaymentService` depende únicamente de la interfaz `IPaymentGateway` (`charge(amount, token, orderId): Promise<PaymentResult>`), inyectada por el token `PAYMENT_GATEWAY`. `CulqiPaymentService` y `MercadoPagoPaymentService` son dos implementaciones intercambiables en `infrastructure/`; cuál se usa lo decide `PAYMENT_PROVIDER` en `.env` (default `culqi`).

En el storefront, el mismo principio aplica al feature-flag del widget: si `NEXT_PUBLIC_PAYMENT_PROVIDER`/`NEXT_PUBLIC_CULQI_PUBLIC_KEY` no están configurados, se muestra "Pago no disponible" en vez de un formulario roto o un campo de texto para pegar un token a mano.

# Alternativas descartadas

- Integrar Culqi directo en `PaymentService` y resolver "agregar Mercado Pago" cuando hiciera falta: se descartó porque el costo de la abstracción es bajo y evita una reescritura completa del caso de uso el día que cambie la pasarela por defecto.

# Consecuencias

- Cambiar de pasarela por defecto es cambiar una variable de entorno, no código.
- Agregar una tercera pasarela (ej. Stripe si el negocio se internacionaliza) es una clase nueva que implementa `IPaymentGateway`, sin tocar `PaymentService`.
