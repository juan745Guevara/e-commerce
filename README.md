# Atelier

Monorepo de e-commerce: API, vitrina pública y panel de administración, detrás de nginx.

El **backend** es dueño de auth, catálogo, carrito, pedidos y pagos. Storefront y admin son clientes: **no** hablan con Postgres ni con Cloudinary.

| App | Carpeta | Stack | Puerto local | README |
| --- | --- | --- | --- | --- |
| API | [`backend/`](backend/) | NestJS 12 (ESM), Prisma 6, PostgreSQL | `3000` | [detalle](backend/README.md) |
| Tienda | [`storefront/`](storefront/) | Next.js 16, React 19, Tailwind 4 | `3001` | [detalle](storefront/README.md) |
| Admin | [`admin/`](admin/) | Vite 8, React 19, React Router 7, Socket.IO | `5173` | [detalle](admin/README.md) |

## Arquitectura

```
                    ┌─────────────┐
                    │    nginx    │  :80 / :443  (Docker)
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     storefront          admin          backend
     Next.js :3001    Vite/SPA        NestJS :3000
           │               │               │
           │  BFF /api/*   │  JWT + WS     │
           └───────────────┴───────┬───────┘
                                   ▼
                         PostgreSQL · Cloudinary
                         Culqi / Mercado Pago
```

- El **navegador de la tienda** no llama a la API para nada de sesión: usa Route Handlers en `storefront/src/app/api/*` (BFF). El JWT vive en cookie httpOnly.
- El **admin** sí llama a la API desde el navegador. El JWT va en `sessionStorage`.
- El catálogo público (home, `/catalogo`, ficha) lo pide el storefront **en el servidor** a `API_URL`.

## Qué incluye

- Auth JWT (7 días), roles `cliente` / `admin`. El registro siempre crea `cliente`.
- Catálogo (categorías, productos, filtros, imágenes en Cloudinary, máx. 5 MB).
- Carrito persistente por usuario.
- Checkout atómico: stock + pedido + vaciar carrito en una transacción.
- Pedidos: `PENDIENTE` → `PAGADO` → `ENVIADO` → `ENTREGADO` (`PENDIENTE` también puede ir a `CANCELADO`).
- Pagos: Culqi (default) o Mercado Pago, según `PAYMENT_PROVIDER`.
- Admin en vivo: Socket.IO, evento `order.status.changed`.
- ISR en home y catálogo (revalidación cada 120 s).

## Requisitos

- Node.js 24 y npm
- PostgreSQL 16+ (o Docker)
- Opcional: Cloudinary, Culqi o Mercado Pago

## Desarrollo local

Tres terminales. Primero la API, después tienda y admin.

### 1. Backend

Crea `backend/.env` (mínimo `DATABASE_URL` y `JWT_SECRET`). Guía completa: [backend/README.md](backend/README.md).

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

Health: [http://localhost:3000/health](http://localhost:3000/health).

### 2. Storefront

Crea `storefront/.env`:

```env
API_URL=http://localhost:3000
JWT_SECRET=el-mismo-secreto-del-backend
COOKIE_SECURE=false
```

```bash
cd storefront
npm install
npm run dev
```

[http://localhost:3001](http://localhost:3001).

### 3. Admin

Crea `admin/.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
cd admin
npm install
npm run dev
```

[http://localhost:5173](http://localhost:5173).

### Usuario admin

El registro de la tienda crea `cliente`. Para entrar al panel:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'tu@email.com';
```

## Docker

Copia [`.env.example`](.env.example) a `.env` en la **raíz** y completa las variables. `DATABASE_URL` debe usar el host `postgres`. `API_URL` interno: `http://backend:3000`. `VITE_API_URL` es la URL **pública** que verá el browser (p. ej. `http://api.localhost`).

```bash
cp .env.example .env
docker compose --profile migrate run --rm migrate
docker compose up -d --build
```

Nginx enruta por `Host` (`STOREFRONT_HOST`, `ADMIN_HOST`, `API_HOST`) al puerto 80.

`NEXT_PUBLIC_*` y `VITE_API_URL` se hornean en el **build**. Si las cambias, reconstruye storefront y admin.

### HTTPS

```bash
# CERTBOT_EMAIL, STOREFRONT_HOST, ADMIN_HOST, API_HOST, SSL_CERT_NAME en .env
sh deploy/init-letsencrypt.sh
```

Pide el certificado y recompone nginx con [`docker-compose.ssl.yml`](docker-compose.ssl.yml) (80 y 443). Certbot renueva en segundo plano.

## API (resumen)

Base: `http://localhost:3000`. Rutas protegidas: `Authorization: Bearer <token>`.

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | Registro (`email`, `password` ≥ 8, `phone` opcional) |
| `POST` | `/auth/login` | — | Login → `{ accessToken, user }` |
| `GET` | `/catalogo/categorias` | — | Categorías |
| `POST` | `/catalogo/categorias` | admin | Crear categoría |
| `GET` | `/catalogo/productos` | — | Productos (`categoryId`, `minPrice`, `maxPrice`, `search`) |
| `GET` | `/catalogo/productos/:id` | — | Detalle |
| `POST` | `/catalogo/productos` | admin | Crear producto |
| `PATCH` | `/catalogo/productos/:id` | admin | Actualizar |
| `DELETE` | `/catalogo/productos/:id` | admin | Borrar |
| `POST` | `/catalogo/productos/:id/imagenes` | admin | Subir imagen (`multipart`, campo `file`) |
| `GET` | `/carrito` | cliente | Ver carrito |
| `POST` | `/carrito/items` | cliente | Agregar ítem |
| `PATCH` | `/carrito/items/:productId` | cliente | Cantidad |
| `DELETE` | `/carrito/items/:productId` | cliente | Quitar |
| `POST` | `/pedidos/checkout` | cliente | Pedido desde el carrito |
| `GET` | `/pedidos` | cliente | Pedidos propios |
| `GET` | `/pedidos/admin` | admin | Todos |
| `GET` | `/pedidos/:id` | dueño o admin | Detalle |
| `PATCH` | `/pedidos/:id/estado` | admin | Transición de estado |
| `POST` | `/pagos/charge` | JWT | Cobrar `{ orderId, token }` |
| `GET` | `/health` | — | `{ "status": "ok" }` |

Detalle de módulos y Prisma: [backend/README.md](backend/README.md).

## Estructura del repo

```
backend/      API NestJS
storefront/   tienda Next.js
admin/        panel Vite
deploy/       nginx + Let's Encrypt
docs/         notas de diseño (SOLID)
```

## Problemas frecuentes

| Síntoma | Qué revisar |
| --- | --- |
| Login en admin rechazado | El usuario sigue siendo `cliente`; promociona el rol en SQL |
| Sesión inválida en la tienda | `JWT_SECRET` de storefront ≠ backend |
| Admin apunta a la API vieja | `VITE_API_URL` es de build; reinicia `npm run dev` o rebuild Docker |
| Checkout sin tarjeta | Faltan `NEXT_PUBLIC_CULQI_PUBLIC_KEY` (y provider) en storefront |
| Imágenes rotas | Cloudinary mal configurado, o el host no es `res.cloudinary.com` |

## Licencia

Las apps están marcadas como `UNLICENSED` (uso privado).
