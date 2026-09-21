---
name: database
description: Modelo de datos actual (Prisma) — entidades, relaciones, y huecos conocidos
---
# Base de datos (Prisma / PostgreSQL)

Esquema completo en `backend/prisma/schema.prisma`. Resumen de entidades y relaciones:

- **User**: `email` (único), `passwordHash`, `phone?`, `role` (`cliente`/`admin`). 1—1 con `Cart`, 1—N con `Order`.
- **Category**: `name`/`slug` únicos. 1—N con `Product`.
- **Product**: `name`, `description`, `price` (Decimal 12,2), `stock` (Int), `images` (String[]), pertenece a `Category`. Referenciado por `CartItem` y `OrderItem`.
- **Cart**: uno por `User` (`userId` único). 1—N con `CartItem`.
- **CartItem**: `(cartId, productId)` único, `quantity`. FK a `Product` con `onDelete: Restrict` (no se puede borrar un producto que está en un carrito).
- **Order**: pertenece a `User` (`onDelete: Restrict`), `status` (enum `OrderStatus`), `total` (Decimal 12,2). 1—N con `OrderItem`.
- **OrderItem**: snapshot de la compra — guarda `productName`/`unitPrice` propios, no solo una FK a `Product`, para no verse afectado por cambios futuros del catálogo.
- **OrderStatus** (enum): `PENDIENTE | PAGADO | ENVIADO | ENTREGADO | CANCELADO`.

## Huecos conocidos (no resueltos — ver `tasks/backlog/`)

- `Order` no tiene ningún campo de dirección de envío.
- No hay modelo de reseñas/calificaciones de producto.
- No hay modelo de cupones/descuentos.
- No hay modelo de favoritos/wishlist.

## Convención de migraciones

`npx prisma migrate dev` en desarrollo, `npx prisma migrate deploy` en CI/producción (`docker compose --profile migrate run --rm migrate`). Regenerar el cliente (`npx prisma generate`) después de cualquier cambio de schema — el `backend.md` agent lo hace antes de asumir que un campo nuevo ya está disponible en el tipo de Prisma.
