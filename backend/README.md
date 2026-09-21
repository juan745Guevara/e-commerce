# Backend — Atelier

API NestJS 12 (ESM) de la tienda. Auth, catálogo, carrito, pedidos, pagos y notificaciones. Overview del monorepo: [README raíz](../README.md).

- Puerto: **3000** (`PORT`)
- Health: `GET /health` → `{ "status": "ok" }`
- Módulo ESM: imports internos con extensión `.js` aunque el código sea `.ts`

## Stack

| Pieza | Uso |
| --- | --- |
| NestJS 12 + Passport JWT | HTTP, DI, guards |
| Prisma 6 + PostgreSQL | Persistencia |
| Cloudinary | Imágenes de producto |
| Culqi o Mercado Pago | Cobro (`PAYMENT_PROVIDER`) |
| Baileys | WhatsApp (prototipo, no es la Cloud API oficial) |
| Socket.IO | Pedidos en vivo para admins |
| Vitest + Oxlint + Prettier | Test, lint, formato |

## Arquitectura

Cada feature vive en `src/<modulo>/` con cuatro capas:

```
<modulo>/
  domain/           entidades, VOs, interfaces de repositorio + tokens, eventos
  application/      servicios (casos de uso) y DTOs
  infrastructure/   Prisma, Cloudinary, Baileys, pasarelas
  presentation/     controllers, gateways
  <modulo>.module.ts
```

Convenciones:

- **Inversión de dependencias.** Los servicios inyectan interfaces (`IOrderRepository`, `ICartRepository`, …) con tokens string (`ORDER_REPOSITORY`). Nunca Prisma directo desde `application`.
- **Lecturas entre módulos** por tokens/servicios exportados, no por modelos Prisma ajenos.
- **Transacciones** vía `ITransactionManager` (`transactions.run`). Checkout (stock + pedido + vaciar carrito) y cancelación (devolver stock) son atómicos: Prisma hace rollback si falla un paso.
- **Eventos** con `EventEmitter2`. `order.status.changed` alimenta el gateway Socket.IO y WhatsApp.
- Validación global: `whitelist` + `forbidNonWhitelisted` + `transform`.
- CORS: cualquier origen, con credenciales.

Notas de diseño SOLID (pagos, notifiers, capas): [`docs/solid-propuesta.md`](../docs/solid-propuesta.md).

## Módulos

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Registro, login, JWT 7 días, roles `cliente` / `admin` |
| `catalogo` | Categorías, productos, filtros, upload de imagen |
| `carrito` | Carrito persistente por usuario |
| `pedidos` | Checkout, listados, transiciones de estado |
| `pagos` | Cobro de pedidos `PENDIENTE` |
| `notificaciones` | WhatsApp en `PAGADO` y `ENVIADO` |
| `shared` | Prisma, `ITransactionManager`, guards JWT/roles, `@CurrentUser()` |

## Arranque local

PostgreSQL tiene que estar arriba. Luego:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

## Variables de entorno

Archivo `.env` en **esta** carpeta. No se commitea.

| Variable | Obligatorio | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | sí | Postgres, p. ej. `postgresql://USER:PASSWORD@localhost:5432/atelier` |
| `JWT_SECRET` | sí | Mismo valor en el storefront |
| `PORT` | no | Default `3000` |
| `CLOUDINARY_CLOUD_NAME` | para imágenes | |
| `CLOUDINARY_API_KEY` | para imágenes | |
| `CLOUDINARY_API_SECRET` | para imágenes | |
| `PAYMENT_PROVIDER` | no | `culqi` (default) o `mercadopago` |
| `PAYMENT_CURRENCY` | no | Default según pasarela; en el proyecto se usa `PEN` |
| `CULQI_SECRET_KEY` | si provider = culqi | Clave **secreta** (el storefront usa la pública) |
| `MERCADOPAGO_ACCESS_TOKEN` | si provider = mercadopago | |
| `WHATSAPP_SESSION_PATH` | no | Default `./wa-auth`. En Docker: `/data/wa-auth` |

Ejemplo mínimo:

```env
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/atelier
JWT_SECRET=cambia-este-secreto
PAYMENT_PROVIDER=culqi
PAYMENT_CURRENCY=PEN
WHATSAPP_SESSION_PATH=./wa-auth
```

## Prisma

Esquema: [`prisma/schema.prisma`](prisma/schema.prisma).

```bash
npx prisma migrate dev      # crea/aplica migración en desarrollo
npx prisma migrate deploy   # aplica las ya versionadas (CI / Docker)
npx prisma generate         # client (obligatorio tras cambiar el schema)
npx prisma studio           # UI de datos
```

Modelos: `User`, `Category`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`.

Roles: enum `cliente` | `admin`. El registro **siempre** deja `cliente`. Un admin se promociona así:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'tu@email.com';
```

## Auth

- `POST /auth/register`: `email`, `password` (mín. 8), `phone` opcional. Teléfono internacional: `51999999999` o `+51999999999` (8–15 dígitos).
- `POST /auth/login`: `{ accessToken, user }`.
- JWT 7 días. Guards: `JwtAuthGuard`, `RolesGuard` + `@Roles('admin')`.
- `@CurrentUser()` inyecta `{ id, email, role }`.

## Catálogo

`GET /catalogo/productos` acepta query:

| Param | Tipo | Uso |
| --- | --- | --- |
| `categoryId` | UUID | Filtrar por categoría |
| `minPrice` / `maxPrice` | number ≥ 0 | Rango; `minPrice` no puede ser mayor que `maxPrice` |
| `search` | string | Nombre o descripción (case insensitive) |

Alta de producto y categoría: solo admin. Imagen: `multipart` campo `file`, máx. 5 MB, `image/*`.

## Pedidos y stock

Transiciones (`canTransition` en `pedidos/domain/entities/order-status.ts`):

```
PENDIENTE → PAGADO | CANCELADO
PAGADO    → ENVIADO
ENVIADO   → ENTREGADO
```

- Checkout (`POST /pedidos/checkout`): si el carrito está vacío → 400. Decrementa stock de forma atómica (`stock >= quantity`); si no alcanza, rollback de todo.
- Cancelar `PENDIENTE`: devuelve stock en la misma transacción.
- Cada cambio de estado emite `order.status.changed` `{ orderId, userId, status }`.

## Pagos

`POST /pagos/charge` con JWT, body `{ orderId, token }`.

- Solo pedidos `PENDIENTE`.
- El `token` lo emite el widget de la pasarela en el frontend (Culqi Checkout, etc.).
- Si el cobro confirma, el pedido pasa a `PAGADO` (y dispara WhatsApp + WebSocket).

## WhatsApp

Implementación actual: **Baileys** (sesión tipo WhatsApp Web). Sirve para demo local. **No es la Cloud API de Meta**; en producción el número se puede banear. El código ya depende de `INotifier`: se puede cambiar el adapter sin tocar el caso de uso.

Comportamiento:

1. Al arrancar, si no hay sesión, imprime un **QR** en la consola. Escanéalo con WhatsApp.
2. Las credenciales quedan en `WHATSAPP_SESSION_PATH` (`.wa-auth/`). Está en `.gitignore`.
3. Solo envía en `PAGADO` y `ENVIADO`.
4. Sin `phone` en el usuario: se loguea y se omite el envío.
5. Si WhatsApp no está conectado, el pedido **igual** cambia de estado; falla solo la notificación.

Mensajes:

- Pagado: `Tu pedido {id} fue pagado y lo estamos preparando.`
- Enviado: `Tu pedido {id} fue enviado.`

Si la sesión se cierra: borra `.wa-auth` y vuelve a escanear.

## WebSocket

`OrderGateway` autentica el handshake con el mismo JWT, en este orden: `auth.token`, header `Authorization`, query `token`. Solo `role === 'admin'` entra a la sala `admins` y recibe `order.status.changed`.

## HTTP

Prefijo vacío (no hay `/api`). Rutas protegidas: `Authorization: Bearer <token>`.

| Método | Ruta | Auth |
| --- | --- | --- |
| `POST` | `/auth/register` | — |
| `POST` | `/auth/login` | — |
| `GET` | `/catalogo/categorias` | — |
| `POST` | `/catalogo/categorias` | admin |
| `GET` | `/catalogo/productos` | — |
| `GET` | `/catalogo/productos/:id` | — |
| `POST` / `PATCH` / `DELETE` | `/catalogo/productos`… | admin |
| `POST` | `/catalogo/productos/:id/imagenes` | admin |
| `GET` / `POST` / `PATCH` / `DELETE` | `/carrito`… | JWT |
| `POST` | `/pedidos/checkout` | JWT |
| `GET` | `/pedidos` | JWT (propios) |
| `GET` | `/pedidos/admin` | admin |
| `GET` | `/pedidos/:id` | dueño o admin |
| `PATCH` | `/pedidos/:id/estado` | admin |
| `POST` | `/pagos/charge` | JWT |
| `GET` | `/health` | — |

## Scripts

| Script | Uso |
| --- | --- |
| `npm run start:dev` | Watch |
| `npm run start:debug` | Debug + watch |
| `npm run start:prod` | `node dist/main` |
| `npm run build` | `nest build` (usa `tsconfig.build.json`, sin tests) |
| `npm test` | Unitarios (Vitest, `*.spec.ts`) |
| `npm run test:watch` | Vitest watch |
| `npm run test:e2e` | e2e (`*.e2e-spec.ts`) |
| `npm run test:cov` | Coverage |
| `npm run lint` | Oxlint type-aware sobre `src/` y `test/` |
| `npm run format` | Prettier |

`tsconfig.build.tsbuildinfo` es cache del compilador: no se edita ni se versiona (`*.tsbuildinfo` en `.gitignore`).

## Docker

El `Dockerfile` (multi-stage Alpine): `npm ci` → `prisma generate` → `nest build` → `node dist/main.js`.

El compose de la raíz:

- Monta el volumen `wa_auth` en `/data/wa-auth`
- Healthcheck contra `/health`
- Perfil `migrate`: `docker compose --profile migrate run --rm migrate` (`prisma migrate deploy`)
