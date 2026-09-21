---
name: pedidos-checkout
description: Checkout atómico, ciclo de vida del pedido y eventos — reglas ya implementadas en backend/src/pedidos
---
# Pedidos y Checkout

## Checkout (`POST /pedidos/checkout`)

- Carrito vacío → 400, no se crea un pedido vacío.
- Operación atómica dentro de una sola transacción (`ITransactionManager`): por cada ítem del carrito, decrementa stock de forma **condicional** (`stock >= quantity`); si algún ítem no tiene stock suficiente, se aborta TODA la operación (rollback), no solo ese ítem.
- Cada `OrderItem` guarda una copia (`productName`, `unitPrice`) del producto al momento de la compra — un cambio de precio o nombre posterior del producto no debe alterar pedidos ya creados.
- Al confirmarse el pedido, se vacía el carrito dentro de la misma transacción.

## Estados (`OrderStatus`)

Única máquina de estados válida:

```
PENDIENTE → PAGADO | CANCELADO
PAGADO    → ENVIADO
ENVIADO   → ENTREGADO
```

Cualquier otra transición (ej. `ENTREGADO → CANCELADO`, o saltarse `PAGADO`) debe rechazarse explícitamente (`canTransition()`), no simplemente "no ocurrir en la UI".

- Cancelar un pedido `PENDIENTE` repone el stock de cada `OrderItem`, también dentro de una transacción atómica.
- Cambiar el estado de un pedido es solo-admin (`PATCH /pedidos/:id/estado`).
- Un cliente solo puede ver sus propios pedidos (`GET /pedidos`) o el detalle de uno propio (`GET /pedidos/:id` — dueño o admin). Ver todos los pedidos (`GET /pedidos/admin`) es solo-admin.

## Eventos

- Cada cambio de estado emite `order.status.changed` (`{ orderId, userId, status }`) vía `EventEmitter2`. `OrderGateway` (Socket.IO) lo retransmite a la sala `admins`.
- `OrderService` no conoce quién escucha el evento ni cuántos listeners hay — ver `plans/decisions/0004-quitar-whatsapp-baileys.md` como prueba real de este desacople (se quitó un listener entero sin tocar `OrderService`).

## Criterios de aceptación para cualquier cambio en este módulo

- [ ] Un checkout con stock insuficiente en cualquier ítem no deja ningún cambio a medias (ni stock decrementado de otros ítems, ni pedido creado, ni carrito vaciado).
- [ ] Una transición de estado inválida devuelve 400 con un mensaje claro, no lanza una excepción no controlada.
- [ ] Todo cambio de estado sigue emitiendo `order.status.changed`, incluso si se agrega un canal nuevo (email, etc.) — el emisor no debe enterarse de los suscriptores.
