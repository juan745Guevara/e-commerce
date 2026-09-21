---
name: carrito
description: Carrito persistente por usuario — reglas ya implementadas en backend/src/carrito
---
# Carrito

- Un carrito por usuario (`Cart.userId` único) — se crea automáticamente la primera vez que el usuario interactúa con él, no hay un endpoint explícito de "crear carrito".
- Cada `CartItem` es único por par `(cartId, productId)` — agregar un producto que ya está en el carrito incrementa la cantidad existente, no crea una fila duplicada.
- `quantity` es un entero ≥ 1 tanto al agregar (`POST /carrito/items`) como al actualizar (`PATCH /carrito/items/:productId`).
- Todas las operaciones (`GET`/`POST`/`PATCH`/`DELETE`) requieren JWT — el carrito siempre pertenece al usuario autenticado, nunca se pasa un `userId` en el body.
- El storefront avisa a otros componentes (contador del header) de cualquier cambio vía el evento `atelier:cart-changed` (`CART_CHANGED_EVENT`), no releyendo el carrito por polling.

## Criterios de aceptación para cualquier cambio en este módulo

- [ ] Agregar una `quantity` mayor al `stock` disponible del producto se rechaza (o se cappea, a decidir explícitamente — hoy no está validado contra `stock` al agregar, solo al hacer checkout).
- [ ] Actualizar/quitar un `productId` que no está en el carrito del usuario devuelve 404, no un 200 silencioso.
- [ ] Cualquier respuesta de carrito incluye el `total` recalculado, nunca uno cacheado desincronizado.
