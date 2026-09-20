# Storefront — Atelier

Vitrina pública de la tienda (Next.js 16, App Router, React 19, Tailwind 4). El overview del monorepo está en el [README raíz](../README.md).

Corre en el puerto **3001** (el 3000 lo usa la API).

## Qué hace

- Home y catálogo con ISR (revalidación cada 120 s)
- Ficha de producto
- Registro / login / logout
- Carrito, checkout y historial de pedidos
- Checkout en dos pasos: crea el pedido y cobra con el token de la pasarela

El catálogo se pide al backend desde el servidor. Auth, carrito, pedidos y pagos van por Route Handlers en `/api/*` para no exponer el JWT al navegador.

## Rutas

| Ruta | Descripción |
| --- | --- |
| `/` | Home con destacados |
| `/catalogo` | Listado con filtro por categoría y texto |
| `/producto/[id]` | Detalle |
| `/login` | Ingreso |
| `/registro` | Alta de cliente (email, password, teléfono opcional) |
| `/carrito` | Carrito |
| `/checkout` | Confirmar pedido y pagar |
| `/pedidos` | Pedidos del usuario |

## BFF (`src/app/api`)

El cliente del browser usa `baseUrl: "/api"`. Esos handlers reenvían a `API_URL` con el JWT de la cookie.

| Handler | Backend |
| --- | --- |
| `POST /api/auth/register` | `POST /auth/register` |
| `POST /api/auth/login` | `POST /auth/login` + cookie `access_token` |
| `POST /api/auth/logout` | borra la cookie |
| `GET /api/auth/me` | valida la sesión |
| `GET/POST/PATCH/DELETE /api/carrito…` | `/carrito` |
| `GET /api/pedidos` | `GET /pedidos` |
| `POST /api/pedidos/checkout` | `POST /pedidos/checkout` |
| `POST /api/pagos/charge` | `POST /pagos/charge` |

Cookie `access_token`: httpOnly, `SameSite=Lax`, 7 días. `COOKIE_SECURE=true` fuerza HTTPS; en local deja `false`.

`JWT_SECRET` debe coincidir con el backend: `getSessionUser()` verifica el token en el storefront.

## Arranque local

La API tiene que estar en `http://localhost:3000`.

```bash
npm install
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001).

## Variables de entorno

```env
API_URL=http://localhost:3000
JWT_SECRET=el-mismo-secreto-del-backend
COOKIE_SECURE=false
```

En Docker, `API_URL` apunta a `http://backend:3000`.

## Estructura

```
src/app/          páginas y Route Handlers
src/components/   UI (catálogo, carrito, checkout, auth)
src/lib/api/      cliente HTTP (server y browser)
src/lib/auth/     cookie y sesión
```

Imágenes remotas: solo `res.cloudinary.com` (`next.config.ts`). Build con `output: "standalone"` para el Dockerfile.

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Next.js en `:3001` |
| `npm run build` | Build de producción |
| `npm start` | Servir el build en `:3001` |
| `npm run lint` | ESLint |

## Docker

El `Dockerfile` genera el standalone de Next y sirve `server.js` como usuario `nextjs`. Nginx de la raíz enruta `STOREFRONT_HOST` a este contenedor.
