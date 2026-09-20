# Atelier

Tienda online con tres aplicaciones: API, vitrina pública y panel de administración. El backend concentra autenticación, catálogo, carrito, pedidos, pagos y notificaciones por WhatsApp.

## Arquitectura

```
                    ┌─────────────┐
                    │    nginx    │  :80 / :443
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     storefront          admin          backend
     Next.js :3001    Vite/SPA :80    NestJS :3000
           │               │               │
           └───────────────┴───────┬───────┘
                                   ▼
                              PostgreSQL
```

| App | Carpeta | Stack | Puerto local |
| --- | --- | --- | --- |
| API | `backend/` | NestJS 12, Prisma, PostgreSQL | `3000` |
| Tienda | `storefront/` | Next.js 16, React 19, Tailwind 4 | `3001` |
| Admin | `admin/` | Vite 8, React 19, Socket.IO | `5173` |

El backend sigue una separación por capas (`domain` / `application` / `infrastructure` / `presentation`) en cada módulo.

Detalle por app: [backend](backend/README.md) · [storefront](storefront/README.md) · [admin](admin/README.md)

## Funcionalidades

- **Auth JWT** con roles `cliente` y `admin`. El registro crea clientes; el rol admin se asigna en base de datos.
- **Catálogo** de productos y categorías. Imágenes en Cloudinary (hasta 5 MB).
- **Carrito** persistente por usuario autenticado.
- **Pedidos** con checkout desde el carrito y ciclo de vida:

  `PENDIENTE` → `PAGADO` → `ENVIADO` → `ENTREGADO`  
  `PENDIENTE` también puede pasar a `CANCELADO`.

- **Pagos** con Culqi (por defecto) o Mercado Pago, según `PAYMENT_PROVIDER`.
- **WhatsApp** (Baileys): avisa al cliente cuando el pedido queda `PAGADO` o `ENVIADO`. Requiere teléfono en el registro y escanear el QR en la consola del backend.
- **Admin en tiempo real**: el panel se suscribe por WebSocket a cambios de estado de pedidos.
- **SEO en la tienda**: catálogo e inicio con ISR (revalidación cada 120 s).

## Requisitos

- Node.js 24
- npm
- PostgreSQL 16+ (o Docker)
- Cuentas opcionales: Cloudinary, Culqi o Mercado Pago, WhatsApp

## Desarrollo local

### 1. Variables de entorno

Copia `.env.example` a `.env` en la raíz (para Docker) y crea otro `.env` en `backend/` para desarrollo:

```env
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

En `storefront/` usa al menos:

```env
API_URL=http://localhost:3000
JWT_SECRET=el-mismo-secreto-del-backend
COOKIE_SECURE=false
```

En `admin/` (Vite):

```env
VITE_API_URL=http://localhost:3000
```

### 2. Base de datos y API

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

El health check queda en [http://localhost:3000/health](http://localhost:3000/health).

### 3. Tienda

```bash
cd storefront
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001).

### 4. Admin

```bash
cd admin
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

### Usuario administrador

El registro siempre crea `cliente`. Para el panel, actualiza el rol en PostgreSQL:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'tu@email.com';
```

## Docker

El `docker-compose.yml` levanta PostgreSQL, backend, storefront, admin y nginx. Hosts típicos en `.env`:

```env
STOREFRONT_HOST=tienda.localhost
ADMIN_HOST=admin.localhost
API_HOST=api.localhost
API_URL=http://backend:3000
VITE_API_URL=http://api.localhost
COOKIE_SECURE=false
```

```bash
cp .env.example .env
# completa las variables

docker compose --profile migrate run --rm migrate
docker compose up -d --build
```

Nginx enruta por `Host` hacia cada servicio en el puerto 80.

### HTTPS (Let's Encrypt)

```bash
# CERTBOT_EMAIL, STOREFRONT_HOST, ADMIN_HOST, API_HOST y SSL_CERT_NAME en .env
sh deploy/init-letsencrypt.sh
```

Eso pide el certificado y recompone nginx con `docker-compose.ssl.yml` (puertos 80 y 443). Certbot renueva en segundo plano.

## API

Prefijo: `http://localhost:3000`. Las rutas protegidas usan `Authorization: Bearer <token>`.

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | Registro de cliente |
| `POST` | `/auth/login` | — | Login (devuelve JWT) |
| `GET` | `/catalogo/categorias` | — | Listar categorías |
| `POST` | `/catalogo/categorias` | admin | Crear categoría |
| `GET` | `/catalogo/productos` | — | Listar productos |
| `GET` | `/catalogo/productos/:id` | — | Detalle de producto |
| `POST` | `/catalogo/productos` | admin | Crear producto |
| `PATCH` | `/catalogo/productos/:id` | admin | Actualizar producto |
| `DELETE` | `/catalogo/productos/:id` | admin | Eliminar producto |
| `POST` | `/catalogo/productos/:id/imagenes` | admin | Subir imagen (`multipart`) |
| `GET` | `/carrito` | cliente | Ver carrito |
| `POST` | `/carrito/items` | cliente | Agregar ítem |
| `PATCH` | `/carrito/items/:productId` | cliente | Cambiar cantidad |
| `DELETE` | `/carrito/items/:productId` | cliente | Quitar ítem |
| `POST` | `/pedidos/checkout` | cliente | Crear pedido desde el carrito |
| `GET` | `/pedidos` | cliente | Pedidos propios |
| `GET` | `/pedidos/admin` | admin | Todos los pedidos |
| `GET` | `/pedidos/:id` | dueño o admin | Detalle |
| `PATCH` | `/pedidos/:id/estado` | admin | Cambiar estado |
| `POST` | `/pagos/charge` | dueño o admin | Cobrar pedido pendiente |
| `GET` | `/health` | — | Estado del servicio |

La tienda no llama al backend desde el navegador para auth, carrito ni pagos: usa Route Handlers en `storefront/src/app/api/` y guarda el JWT en cookie httpOnly.

## Scripts

**Backend**

| Script | Uso |
| --- | --- |
| `npm run start:dev` | API en watch |
| `npm run build` | Compilar |
| `npm test` | Unitarios (Vitest) |
| `npm run test:e2e` | e2e |
| `npm run lint` | Oxlint |

**Storefront**

| Script | Uso |
| --- | --- |
| `npm run dev` | Next.js en `:3001` |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |

**Admin**

| Script | Uso |
| --- | --- |
| `npm run dev` | Vite en `:5173` |
| `npm run build` | Typecheck + build |

## Modelo de datos

Usuarios, categorías, productos, carrito, pedidos e ítems. El esquema está en `backend/prisma/schema.prisma`. Las migraciones se aplican con Prisma.

## Licencia

El código de las apps está marcado como `UNLICENSED` (uso privado).
