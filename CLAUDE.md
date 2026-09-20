# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Atelier — an e-commerce monorepo with three independent apps behind nginx:

| App | Folder | Stack | Local port |
| --- | --- | --- | --- |
| API | `backend/` | NestJS 12 (ESM), Prisma 6, PostgreSQL | `3000` |
| Storefront | `storefront/` | Next.js 16 (App Router), React 19, Tailwind 4 | `3001` |
| Admin | `admin/` | Vite 8, React 19, React Router 7, Socket.IO client | `5173` |

The backend owns auth, catalog, cart, orders, payments, and WhatsApp notifications. The storefront and admin are pure clients — neither talks to Postgres or Cloudinary directly.

## Commands

### Backend (`cd backend`)

```bash
npm run start:dev      # watch mode, http://localhost:3000, health check at /health
npm test               # unit tests (Vitest)
npx vitest run path/to/file.spec.ts       # single unit test file
npx vitest run -t "test name"             # single test by name
npm run test:e2e       # e2e tests (vitest.config.e2e.ts, *.e2e-spec.ts)
npm run test:cov       # coverage
npm run lint           # oxlint --type-aware src/ test/
npm run build          # nest build
npx prisma migrate dev      # create/apply a migration in dev
npx prisma migrate deploy   # apply existing migrations (CI/prod)
npx prisma generate         # regenerate the Prisma client after schema changes
npx prisma studio           # inspect data
```

Requires `backend/.env` (see `backend/README.md`); minimally `DATABASE_URL` and `JWT_SECRET`. `PAYMENT_PROVIDER` selects `culqi` (default) or `mercadopago`. First-run registrations always get role `cliente`; promote an admin via SQL (`UPDATE "User" SET role = 'admin' WHERE email = '...'`).

### Storefront (`cd storefront`)

```bash
npm run dev     # Next.js on :3001
npm run build
npm run lint    # ESLint
```

Requires `API_URL`, `JWT_SECRET` (must match the backend's), `COOKIE_SECURE`.

### Admin (`cd admin`)

```bash
npm run dev       # Vite on :5173
npm run build     # tsc && vite build
```

Requires `VITE_API_URL` — baked in at build time (Vite only exposes `VITE_`-prefixed vars), so changing it means rebuilding.

### Docker (from repo root)

```bash
cp .env.example .env
docker compose --profile migrate run --rm migrate   # prisma migrate deploy
docker compose up -d --build
```

nginx routes by `Host` header (`STOREFRONT_HOST`, `ADMIN_HOST`, `API_HOST`) to each container. `deploy/init-letsencrypt.sh` provisions Let's Encrypt certs and switches nginx to `docker-compose.ssl.yml`.

## Backend architecture

Each feature module under `backend/src/<module>/` follows a fixed 4-layer layout:

```
<module>/
  domain/          entities, value objects, repository interfaces (+ injection tokens), domain events
  application/      services (use cases) + DTOs, orchestrate domain + infra via interfaces
  infrastructure/   Prisma repository implementations, external SDKs (Cloudinary, Baileys, payment providers)
  presentation/     controllers, gateways
  <module>.module.ts
```

Modules: `auth`, `catalogo`, `carrito`, `pedidos`, `pagos`, `notificaciones`, plus `shared` (Prisma service/module, JWT/roles guards, `@CurrentUser()` decorator, cross-cutting domain interfaces).

Key conventions:

- **Dependency inversion via string tokens.** `application` services depend on interfaces (`IOrderRepository`, `ICartRepository`, `IProductRepository`, `ITransactionManager`, ...), never on Prisma directly. Each interface file exports both the TS type and a token constant (e.g. `ORDER_REPOSITORY`); modules bind the token to the concrete `Prisma*Repository` in their `providers` array and `@Inject(TOKEN)` it into services. When adding a new cross-module dependency, follow this pattern instead of importing another module's repository class directly.
- **Cross-module reads happen through exported repository tokens/services**, not direct DB access — e.g. `OrderService` injects `CART_REPOSITORY` and `PRODUCT_REPOSITORY` (exported by `CarritoModule`/`CatalogoModule`) rather than reaching into their Prisma models.
- **Transactions are abstracted behind `ITransactionManager`** (`shared/domain/interfaces/transaction-manager.interface.ts`): `transactions.run(async (tx) => {...})` threads an opaque `tx` handle through repository calls that accept an optional `tx` param. Any multi-step write that must be atomic (e.g. `OrderService.checkout` decrementing stock + creating the order + clearing the cart; `changeStatus` reverting stock on cancellation) goes through this, so Prisma can roll back the whole operation on failure — this is what prevents concurrent checkouts from oversubscribing stock.
- **Domain events** (e.g. `order.status.changed` from `pedidos/domain/events/order-status-changed.event.ts`) go through `EventEmitter2`. `OrderGateway` (Socket.IO) and the WhatsApp notifier both react to `order.status.changed`; order status transitions are validated by `canTransition()` in `pedidos/domain/entities/order-status.ts` (`PENDIENTE → PAGADO|CANCELADO`, `PAGADO → ENVIADO`, `ENVIADO → ENTREGADO`).
- **Auth**: JWT via Passport (`shared/infrastructure/guards/jwt-auth.guard.ts`, `roles.guard.ts` + `@Roles()`), roles are `cliente`/`admin`. The Socket.IO gateway authenticates the same JWT from the handshake (`auth.token`, `Authorization` header, or `token` query param) and only admits role `admin` into the `admins` room.
- Prisma schema: `backend/prisma/schema.prisma` (`User`, `Category`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`). Regenerate the client (`npx prisma generate`) after schema edits.
- Module is ESM (`"type": "module"` in `package.json`) — internal imports use explicit `.js` extensions even though source is `.ts`.
- Linting is `oxlint --type-aware`, not ESLint.

## Storefront architecture

The storefront never lets the browser talk to the backend directly for anything auth/session-sensitive — the browser calls its own Route Handlers under `src/app/api/*`, which forward to the NestJS `API_URL` server-side and manage the JWT as an httpOnly cookie (`access_token`, `SameSite=Lax`, 7 days, `COOKIE_SECURE` controls the `Secure` flag). Public catalog reads (home/`/catalogo`, ISR revalidated every 120s) are fetched server-side directly from the backend.

- `src/app/api/*` — BFF route handlers (auth, carrito, pedidos, pagos) mirroring the corresponding backend routes.
- `src/lib/api/` — HTTP clients (separate server- and browser-side variants).
- `src/lib/auth/` — cookie/session helpers; `getSessionUser()` verifies the JWT locally, so `JWT_SECRET` must match the backend's.
- Remote images restricted to `res.cloudinary.com` (`next.config.ts`); build output is `standalone` for the Docker image.
- `AGENTS.md`/`CLAUDE.md` in `storefront/` are auto-regenerated by `next dev` on every run (see `node_modules/next/dist/server/lib/generate-agent-files.js`) — don't hand-edit their content, just commit them if they show as changed.

## Admin architecture

SPA with `src/pages` (Login, Productos, Pedidos), `src/components` (Layout, `ProtectedRoute`), `src/auth` (`AuthContext`), `src/lib` (HTTP client, session storage, Socket.IO client, types). Session (`admin.accessToken`, `admin.user`) lives in `sessionStorage` and is cleared on token expiry, non-admin role, or a 401 from the API. Any unmatched route redirects to `/`.
