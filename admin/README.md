# Admin — Atelier

Panel SPA (Vite 8, React 19, React Router 7, Socket.IO client) para catálogo y pedidos. Overview del monorepo: [README raíz](../README.md).

Local: [http://localhost:5173](http://localhost:5173). La API se configura con `VITE_API_URL`.

A diferencia de la tienda, **el navegador sí llama a Nest**. El JWT no va en cookie: vive en `sessionStorage`.

## Qué hace

- Login **solo** si `role === 'admin'` (un `cliente` se rechaza aunque el password sea correcto)
- CRUD de productos y alta de categorías
- Subida de imagen: `POST /catalogo/productos/:id/imagenes` (`multipart` campo `file`)
- Listado de todos los pedidos (`GET /pedidos/admin`)
- Cambio de estado respetando las transiciones del backend
- Badge de socket: recibe `order.status.changed` y refresca la lista

## Rutas

| Ruta | Descripción |
| --- | --- |
| `/login` | Ingreso |
| `/productos` | Catálogo (ruta por defecto tras login) |
| `/pedidos` | Operaciones |

Cualquier otra URL → `/`. `ProtectedRoute` manda a `/login` si no hay sesión admin.

## Auth

Claves en `sessionStorage`:

- `admin.accessToken`
- `admin.user`

Se limpia si:

- el JWT expiró
- el rol no es `admin`
- la API responde **401**

El registro de la **tienda** siempre crea `cliente`. Para usar este panel, promociona el usuario en PostgreSQL:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'tu@email.com';
```

Luego `POST /auth/login` contra `VITE_API_URL`.

## Tiempo real

Socket.IO se conecta a `VITE_API_URL` con `{ auth: { token } }`. El backend solo admite admins en la sala `admins` y emite `order.status.changed` `{ orderId, userId, status }`.

Estados y transiciones (igual que la API):

```
PENDIENTE → PAGADO | CANCELADO
PAGADO    → ENVIADO
ENVIADO   → ENTREGADO
```

## Arranque local

API en `http://localhost:3000`. Usuario con `role = 'admin'`.

```bash
npm install
npm run dev
```

## Variables de entorno

Archivo `.env` en esta carpeta. Vite **solo** expone variables con prefijo `VITE_`, y las **incrusta en el build**.

```env
VITE_API_URL=http://localhost:3000
```

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL de Nest que usará el **browser**. En Docker debe ser la pública (`http://api.localhost` o el `API_HOST`), no `http://backend:3000` |

En Docker se pasa como build-arg:

```dockerfile
ARG VITE_API_URL=http://api.localhost
```

Si cambias la URL: reinicia `npm run dev` en local, o **rebuild** de la imagen en Docker. No basta con cambiar el `.env` del contenedor en runtime.

## Estructura

```
src/pages/         LoginPage, ProductsPage, OrdersPage
src/components/    AdminLayout, ProtectedRoute
src/auth/          AuthContext
src/lib/           cliente HTTP, sessionStorage, Socket.IO, tipos, dinero
```

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Vite en `:5173` |
| `npm run build` | `tsc` + Vite |
| `npm run preview` | Preview del build en `:5173` |

## Docker

El `Dockerfile` genera el estático y lo sirve con nginx (`try_files` → `index.html` para el SPA). El compose de la raíz enruta `ADMIN_HOST` a este contenedor.
