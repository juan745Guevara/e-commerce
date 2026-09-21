# Storefront — Atelier

Vitrina pública (Next.js 16 App Router, React 19, Tailwind 4). Overview del monorepo: [README raíz](../README.md).

Puerto **3001** (el 3000 es la API).

La tienda **nunca** deja que el navegador hable con Nest para auth, carrito, pedidos o pagos. El browser pega a Route Handlers en `/api/*`; esos handlers reenvían a `API_URL` y manejan el JWT en cookie httpOnly.

El catálogo público (home, `/catalogo`, ficha) sí se pide al backend **en el servidor**.

## Stack

- Next.js 16 (App Router), `output: "standalone"`
- React 19, Tailwind 4, Motion
- `jose` para verificar el JWT en el servidor (`getSessionUser()`)
- Imágenes remotas solo desde `res.cloudinary.com`

## Rutas

| Ruta | Qué es | Datos |
| --- | --- | --- |
| `/` | Home, destacados | ISR 120 s, `GET` catálogo en servidor |
| `/catalogo` | Listado, filtro categoría y texto | ISR 120 s |
| `/producto/[id]` | Ficha | ISR 120 s |
| `/login` | Ingreso | BFF `/api/auth/login` |
| `/registro` | Alta (`email`, `password`, `phone` opcional) | BFF `/api/auth/register` |
| `/carrito` | Carrito | BFF, requiere sesión |
| `/checkout` | Confirmar pedido + widget Culqi | BFF checkout + charge |
| `/pedidos` | Historial del usuario | BFF `/api/pedidos` |

Cualquier flujo de sesión usa cookie `access_token`. Sin cookie, carrito / checkout / pedidos te mandan a login.

## BFF (`src/app/api`)

El cliente del browser usa `baseUrl: "/api"`.

| Handler | Backend |
| --- | --- |
| `POST /api/auth/register` | `POST /auth/register` |
| `POST /api/auth/login` | `POST /auth/login` + set cookie |
| `POST /api/auth/logout` | borra la cookie |
| `GET /api/auth/me` | sesión local (`JWT_SECRET`) |
| `GET /api/carrito` | `GET /carrito` |
| `POST /api/carrito/items` | `POST /carrito/items` |
| `PATCH /api/carrito/items/:productId` | `PATCH /carrito/items/:productId` |
| `DELETE /api/carrito/items/:productId` | `DELETE /carrito/items/:productId` |
| `GET /api/pedidos` | `GET /pedidos` |
| `POST /api/pedidos/checkout` | `POST /pedidos/checkout` |
| `POST /api/pagos/charge` | `POST /pagos/charge` |

Cookie `access_token`:

- httpOnly, `SameSite=Lax`, 7 días
- `COOKIE_SECURE=true` pone el flag `Secure` (HTTPS). En local: `false`
- `JWT_SECRET` **tiene que coincidir** con el backend: `getSessionUser()` verifica el token aquí, sin round-trip

## Checkout y pagos

Flujo:

1. `POST /api/pedidos/checkout` crea el pedido `PENDIENTE` y vacía el carrito (stock ya descontado en la API).
2. Si hay `NEXT_PUBLIC_CULQI_PUBLIC_KEY`, el widget Culqi Checkout v4 tokeniza la tarjeta en el **navegador**.
3. `POST /api/pagos/charge` manda `{ orderId, token }` al backend.

Sin llave pública (o sin provider), `/checkout` muestra **Pago no disponible**: no se le pide un token a mano al cliente.

`NEXT_PUBLIC_*` se lee **al compilar** el bundle. En Docker van como `build.args` del servicio `storefront`, no basta con `environment`.

## Arranque local

La API tiene que estar en `http://localhost:3000`.

```bash
npm install
npm run dev
```

[http://localhost:3001](http://localhost:3001).

## Variables de entorno

Archivo `.env` en esta carpeta.

| Variable | Obligatorio | Descripción |
| --- | --- | --- |
| `API_URL` | sí | Nest, p. ej. `http://localhost:3000`. En Docker: `http://backend:3000` |
| `JWT_SECRET` | sí | Idéntico al backend |
| `COOKIE_SECURE` | no | `false` en local, `true` detrás de HTTPS |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | para tarjeta | `culqi` |
| `NEXT_PUBLIC_CULQI_PUBLIC_KEY` | para tarjeta | `pk_test_…` / `pk_live_…` |
| `NEXT_PUBLIC_PAYMENT_CURRENCY` | no | Default `PEN` |

```env
API_URL=http://localhost:3000
JWT_SECRET=el-mismo-secreto-del-backend
COOKIE_SECURE=false
NEXT_PUBLIC_PAYMENT_PROVIDER=culqi
NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_PAYMENT_CURRENCY=PEN
```

## Estructura

```
src/app/            páginas (App Router) y Route Handlers
src/app/api/        BFF → Nest
src/components/     catálogo, carrito, checkout, auth, layout
src/lib/api/        cliente HTTP (server: API_URL, browser: /api)
src/lib/auth/       cookie y getSessionUser()
public/products/    placeholders SVG de categoría
```

`AGENTS.md` / `CLAUDE.md` de esta carpeta los regenera `next dev`. No los edites a mano; si aparecen sucios en git, se pueden commitear.

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Next en `:3001` |
| `npm run build` | Producción (standalone) |
| `npm start` | Sirve el build en `:3001` |
| `npm run lint` | ESLint |

## Docker

El `Dockerfile` genera el standalone y corre `server.js` como usuario `nextjs`. Nginx de la raíz enruta `STOREFRONT_HOST` a este contenedor.

Tras cambiar `NEXT_PUBLIC_*`, hay que **rebuild** de la imagen.
