---
name: storefront-nextjs
description: Convenciones del storefront (Next.js 16 App Router) — BFF, cookies httpOnly, ISR. Seguir para cualquier feature nueva orientada al cliente.
---
# Next.js 16 (App Router) — Storefront

1. **BFF obligatorio para todo lo sensible a sesión.** El navegador nunca llama a `API_URL` directo para auth/carrito/pedidos/pagos — pasa por `src/app/api/*` (Route Handlers), que reenvían al backend server-side y manejan el JWT como cookie httpOnly (`access_token`, `SameSite=Lax`, `COOKIE_SECURE`).
2. **Lecturas públicas del catálogo van server-side con ISR**, no `fetch` desde el cliente — home y `/catalogo` revalidan cada 120s (`export const revalidate = 120`). Esto es lo que mantiene el SEO.
3. **`getSessionUser()` verifica el JWT localmente** — `JWT_SECRET` del storefront tiene que ser exactamente el mismo que el del backend, o toda sesión se invalida silenciosamente.
4. **Imágenes remotas restringidas a `res.cloudinary.com`** en `next.config.ts` — cualquier otro host de imágenes hay que agregarlo ahí explícitamente, no funciona "porque sí".
5. **Sincronizar estado entre componentes con eventos de `window`**, no una librería de estado global — ver `CART_CHANGED_EVENT` (`src/lib/cart/cart-events.ts`) como el patrón ya establecido para "el carrito cambió, refresca el contador".
