---
name: payment-gateways
description: Cómo el proyecto abstrae pasarelas de pago (Culqi / Mercado Pago) detrás de IPaymentGateway. Seguir para cualquier cambio en pagos.
---
# Pasarelas de pago intercambiables (DIP)

1. **`application/` nunca importa el SDK de una pasarela.** `PaymentService` solo conoce `IPaymentGateway` (`charge(amount, token, orderId): Promise<PaymentResult>`); Culqi y Mercado Pago son dos clases en `infrastructure/` que la implementan.
2. **La pasarela activa se elige por `PAYMENT_PROVIDER`** (`culqi` por default o `mercadopago`), inyectada vía el token `PAYMENT_GATEWAY` — nunca un `if (provider === 'culqi')` disperso en el service.
3. **El token de tarjeta lo genera el widget en el frontend**, nunca el backend construye ni recibe el número de tarjeta crudo — el backend solo recibe `{ orderId, token }`.
4. **Solo se puede cobrar un pedido `PENDIENTE`.** Cualquier intento sobre otro estado es un `BadRequestException`, no un cobro silencioso.
5. **Variables `NEXT_PUBLIC_*` de la pasarela (clave pública) se hornean en build time en el storefront** — requieren `ARG`/`ENV` en el `Dockerfile` y `build.args` en `docker-compose.yml`, no alcanza con el `.env` en runtime (ver `storefront/README.md`).
