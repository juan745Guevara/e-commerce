---
name: pagos
description: Cobro de pedidos vía pasarela intercambiable — reglas ya implementadas en backend/src/pagos
---
# Pagos

## Cobro (`POST /pagos/charge`)

- Requiere JWT. Body: `{ orderId, token }`.
- Solo se puede cobrar un pedido en estado `PENDIENTE` — cualquier otro estado es 400.
- El `token` lo emite el widget de la pasarela en el frontend (Culqi Checkout v4 hoy); el backend nunca ve el número de tarjeta.
- Pasarela activa según `PAYMENT_PROVIDER` (`culqi` default, o `mercadopago`), detrás de `IPaymentGateway` — ver `.claude/skills/payment-gateways/SKILL.md`.
- Si el cobro confirma (`result.succeeded`), el pedido pasa a `PAGADO` (dispara `order.status.changed`, ver `specs/pedidos-checkout.md`). Si no confirma, se lanza `BadRequestException` y el pedido se queda `PENDIENTE` — el cliente puede reintentar el pago después (ver "Pagar ahora" en `/pedidos` del storefront).

## Frontend (storefront)

- Si `NEXT_PUBLIC_PAYMENT_PROVIDER === 'culqi'` y hay `NEXT_PUBLIC_CULQI_PUBLIC_KEY`, se muestra el widget real de Culqi en el checkout y en "Pagar ahora" de un pedido pendiente.
- Si no está configurado, se muestra "Pago no disponible" — nunca un campo de texto para pegar un token manualmente (eso era el comportamiento viejo, ya corregido).

## Criterios de aceptación para cualquier cambio en este módulo

- [ ] Intentar cobrar un pedido que no es del usuario autenticado (y no es admin) se rechaza.
- [ ] Un cobro fallido de la pasarela no deja el pedido en un estado ambiguo — sigue `PENDIENTE`, explícitamente.
- [ ] Cualquier pasarela nueva se agrega como una clase que implementa `IPaymentGateway`, nunca como un `if` adicional en `PaymentService`.
