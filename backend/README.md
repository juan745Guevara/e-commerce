# Backend — Atelier

API NestJS 12 de la tienda. Expone auth, catálogo, carrito, pedidos, pagos y notificaciones. El overview del monorepo está en el [README raíz](../README.md).

## Stack

- NestJS 12 (ESM) + Passport JWT
- Prisma 6 + PostgreSQL
- Cloudinary (imágenes)
- Culqi o Mercado Pago
- Baileys (WhatsApp)
- Socket.IO (pedidos en tiempo real)
- Vitest + Oxlint

Puerto por defecto: `3000`. Health check: `GET /health`.

## Módulos

Cada módulo usa `domain` / `application` / `infrastructure` / `presentation`.

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Registro, login, JWT (7 días), roles `cliente` / `admin` |
| `catalogo` | Categorías, productos, filtros y subida de imágenes |
| `carrito` | Carrito persistente por usuario |
| `pedidos` | Checkout, listados y transiciones de estado |
| `pagos` | Cobro de pedidos `PENDIENTE` |
| `notificaciones` | WhatsApp cuando el pedido pasa a `PAGADO` o `ENVIADO` |
| `shared` | Prisma, guards JWT/roles, decorador `@CurrentUser()` |

Los cambios de estado emiten `order.status.changed`. Ese evento alimenta el gateway de admins y WhatsApp.

## Arranque local

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

CORS acepta cualquier origen con credenciales. Validación global: `whitelist` + `forbidNonWhitelisted`.

## Variables de entorno

Crea un `.env` en esta carpeta:

```env
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/atelier
JWT_SECRET=cambia-este-secreto

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PAYMENT_PROVIDER=culqi
PAYMENT_CURRENCY=PEN
CULQI_SECRET_KEY=
MERCADOPAGO_ACCESS_TOKEN=

WHATSAPP_SESSION_PATH=./wa-auth
```

- `PAYMENT_PROVIDER`: `culqi` (default) o `mercadopago`.
- `WHATSAPP_SESSION_PATH`: carpeta de sesión de Baileys. En Docker es `/data/wa-auth`.

## Prisma

Esquema: `prisma/schema.prisma`.

```bash
npx prisma migrate dev          # desarrollo
npx prisma migrate deploy       # entornos ya versionados
npx prisma generate
npx prisma studio
```

Modelos: `User`, `Category`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`.

El registro siempre crea `cliente`. Un admin se promociona así:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'tu@email.com';
```

## Pedidos y pagos

Transiciones válidas:

```
PENDIENTE → PAGADO | CANCELADO
PAGADO    → ENVIADO
ENVIADO   → ENTREGADO
```

`POST /pagos/charge` recibe `{ orderId, token }`. El `token` lo emite el frontend de la pasarela configurada. Si el cobro confirma, el pedido pasa a `PAGADO`.

Filtros de catálogo en `GET /catalogo/productos`: `categoryId`, `minPrice`, `maxPrice`, `search`.

## WhatsApp

Al arrancar, Baileys imprime un QR en la consola. Escanéalo con WhatsApp. La sesión se reutiliza desde `WHATSAPP_SESSION_PATH`.

El cliente necesita `phone` en formato internacional (`51999999999`). Sin teléfono, el evento se registra y se omite el envío.

## WebSocket

El `OrderGateway` autentica el handshake con JWT (`auth.token`, header `Authorization` o query `token`). Solo rol `admin` entra a la sala `admins` y recibe `order.status.changed`.

## Scripts

| Script | Uso |
| --- | --- |
| `npm run start:dev` | Watch |
| `npm run start:debug` | Debug + watch |
| `npm run start:prod` | `node dist/main` |
| `npm run build` | Compilar |
| `npm test` | Unitarios (Vitest) |
| `npm run test:watch` | Vitest en watch |
| `npm run test:e2e` | e2e |
| `npm run test:cov` | Coverage |
| `npm run lint` | Oxlint con type-aware |
| `npm run format` | Prettier |

## Docker

El `Dockerfile` genera Prisma, compila y corre `node dist/main.js` en Alpine. El compose de la raíz monta el volumen `wa_auth` y usa el perfil `migrate` para `prisma migrate deploy`.
