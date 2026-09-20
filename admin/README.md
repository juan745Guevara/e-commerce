# Admin — Atelier

Panel SPA (Vite 8, React 19, React Router 7) para catálogo y pedidos. El overview del monorepo está en el [README raíz](../README.md).

En local corre en [http://localhost:5173](http://localhost:5173). Llama a la API con `VITE_API_URL`.

## Qué hace

- Login exclusivo para rol `admin`
- CRUD de productos y alta de categorías
- Subida de imagen a Cloudinary vía `POST /catalogo/productos/:id/imagenes`
- Listado de pedidos y cambio de estado según las transiciones del backend
- Badge de socket: recibe `order.status.changed` en vivo

## Rutas

| Ruta | Descripción |
| --- | --- |
| `/login` | Ingreso |
| `/productos` | Catálogo (ruta por defecto) |
| `/pedidos` | Operaciones |

Cualquier otra URL redirige a `/`. `ProtectedRoute` manda a `/login` si no hay sesión admin.

## Auth y tiempo real

El JWT se guarda en `sessionStorage` (`admin.accessToken`, `admin.user`). Se limpia si el token expiró, el rol no es `admin` o la API responde 401.

Socket.IO se conecta a `VITE_API_URL` con `{ auth: { token } }`. El backend solo acepta admins en la sala `admins`.

## Arranque local

La API tiene que estar en `http://localhost:3000`. El usuario debe tener `role = 'admin'` en PostgreSQL (el registro de la tienda crea `cliente`).

```bash
npm install
npm run dev
```

## Variables de entorno

Archivo `.env` en esta carpeta (Vite solo expone prefijo `VITE_`):

```env
VITE_API_URL=http://localhost:3000
```

Esa URL se hornea en el build. En Docker se pasa como build-arg:

```dockerfile
ARG VITE_API_URL=http://api.localhost
```

Tras cambiarla hay que reconstruir la imagen.

## Estructura

```
src/pages/        Login, productos, pedidos
src/components/   Layout y ruta protegida
src/auth/         AuthContext
src/lib/          cliente HTTP, sesión, socket, tipos
```

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Vite en `:5173` |
| `npm run build` | `tsc` + build |
| `npm run preview` | Preview del build en `:5173` |

## Docker

El `Dockerfile` genera el estático y lo sirve con nginx (`try_files` → `index.html`). El compose de la raíz enruta `ADMIN_HOST` a este contenedor.
