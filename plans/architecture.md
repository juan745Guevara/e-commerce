---
name: architecture
description: Vista de arquitectura del monorepo — tres apps, cómo se comunican, capas del backend
---
# Arquitectura (Atelier)

## Vista general

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

- `storefront` (Next.js 16, cliente público): nunca habla con Postgres/Cloudinary directo. Sesión sensible pasa por su propio BFF (`src/app/api/*`); catálogo público se lee server-side con ISR.
- `admin` (Vite + React, panel interno): SPA que sí llama a la API desde el navegador; sesión en `sessionStorage`; recibe eventos en vivo por Socket.IO.
- `backend` (NestJS 12 ESM + Prisma 6 + PostgreSQL): dueño de auth, catálogo, carrito, pedidos y pagos.

## Capas del backend (por módulo)

```
<modulo>/
  domain/           entidades, VOs, interfaces de repositorio + tokens, eventos
  application/      servicios (casos de uso) y DTOs
  infrastructure/   Prisma, Cloudinary, pasarelas de pago
  presentation/     controllers, gateways
  <modulo>.module.ts
```

Módulos: `auth`, `catalogo`, `carrito`, `pedidos`, `pagos`, más `shared` (Prisma, `ITransactionManager`, guards JWT/roles).

## Decisiones registradas

Ver `plans/decisions/` para el porqué de cada decisión técnica relevante — no se repite aquí para evitar que las dos fuentes se desincronicen.
