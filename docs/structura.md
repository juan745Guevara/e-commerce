# Estructura del proyecto — Atelier

Monorepo en la raíz `e-commerce/`. Tres apps + specs + infra.

## Vista en producción

```
                    nginx (:80 / :443)
           ┌────────────┼────────────┐
           ▼            ▼            ▼
      storefront      admin       backend
      (Next.js)       (SPA)       (NestJS)
           │            │            │
           └────────────┴────────────┘
                        │
              PostgreSQL · Cloudinary
              Culqi / Mercado Pago
```

| App | Carpeta | Stack | Puerto local |
| --- | --- | --- | --- |
| API | `backend/` | NestJS 12, Prisma 6, PostgreSQL | `3000` |
| Tienda | `storefront/` | Next.js 16, React 19, Tailwind 4 | `3001` |
| Admin | `admin/` | Vite 8, React 19, React Router 7 | `5173` |

El **backend** es dueño de auth, catálogo, carrito, pedidos y pagos. Storefront y admin son clientes: no hablan con Postgres ni Cloudinary directamente.

---

## Raíz del repositorio

```
e-commerce/
├── backend/              API NestJS (auth, catálogo, carrito, pedidos, pagos)
├── storefront/           Tienda pública Next.js
├── admin/                Panel admin Vite + React
├── specs/                Reglas de negocio (spec-driven)
├── plans/                Arquitectura técnica y ADRs
├── tasks/                Backlog de trabajo (backlog → in-progress → done)
├── docs/                 Documentación extra
├── deploy/               nginx y Let's Encrypt
├── .github/workflows/    CI (lint, test, build)
├── .claude/              Agentes y skills para desarrollo con IA
├── docker-compose.yml    Stack Docker (Postgres, apps, nginx)
├── docker-compose.ssl.yml  Override con HTTPS
├── .env.example          Variables de entorno de ejemplo
├── README.md             Guía principal del monorepo
└── CLAUDE.md             Convenciones para agentes/IA
```

---

## `backend/` — API (puerto 3000)

```
backend/
├── prisma/
│   ├── schema.prisma       Modelos: User, Product, Cart, Order…
│   └── migrations/         Migraciones SQL versionadas
├── src/
│   ├── main.ts             Entrada de NestJS
│   ├── app.module.ts       Módulo raíz
│   ├── app.controller.ts   Health check
│   │
│   ├── auth/               Login, registro, JWT
│   ├── catalogo/           Productos, categorías, imágenes
│   ├── carrito/            Bolsa del usuario
│   ├── pedidos/            Checkout, estados, WebSocket
│   ├── pagos/              Culqi / Mercado Pago
│   └── shared/             Prisma, guards, transacciones
│
└── test/                   Tests e2e
```

### Capas dentro de cada módulo (`auth`, `carrito`, etc.)

Cada feature sigue la misma forma:

```
<modulo>/
├── domain/
│   ├── entities/           Objetos de negocio (User, Order, Cart…)
│   ├── interfaces/         Contratos (IUserRepository, IPaymentGateway…)
│   └── events/             Eventos de dominio (solo pedidos)
├── application/
│   ├── services/           Casos de uso (AuthService, OrderService…)
│   └── dto/                Validación de entrada/salida
├── infrastructure/
│   ├── repositories/       Prisma*Repository (acceso a BD)
│   ├── cloudinary/         Subida de imágenes (catálogo)
│   └── *.service.ts        APIs externas (Culqi, Mercado Pago)
├── presentation/
│   ├── *.controller.ts     Rutas HTTP REST
│   └── order.gateway.ts    Socket.IO (solo pedidos)
└── <modulo>.module.ts      Wiring Nest (providers, exports)
```

### Módulos del backend

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Registro, login, JWT, roles `cliente` / `admin` |
| `catalogo` | Categorías, productos, imágenes (Cloudinary) |
| `carrito` | Ver y editar la bolsa, validar stock |
| `pedidos` | Checkout atómico, cambio de estado, eventos |
| `pagos` | Cobro con Culqi o Mercado Pago |
| `shared` | Prisma, guards JWT, transacciones, decoradores |

### `shared/` — código común

```
shared/
├── domain/interfaces/      ITransactionManager
├── infrastructure/
│   ├── prisma/             PrismaService, PrismaTransactionManager
│   ├── guards/             JwtAuthGuard, RolesGuard
│   ├── decorators/         @CurrentUser()
│   └── interceptors/       Cross-cutting HTTP
```

### Desacoplamiento de base de datos

| Capa | Carpeta | ¿Conoce Prisma/Postgres? |
| --- | --- | --- |
| Reglas de negocio | `*/application/services/` | No |
| Contratos | `*/domain/interfaces/` | No |
| Acceso a datos | `*/infrastructure/repositories/prisma-*` | Sí |
| ORM + schema | `shared/infrastructure/prisma/`, `prisma/` | Sí |

---

## `storefront/` — Tienda (puerto 3001)

```
storefront/
├── public/                 Assets estáticos (imágenes locales)
├── src/
│   ├── app/                Next.js App Router
│   │   ├── layout.tsx      Layout global
│   │   ├── globals.css     Tailwind 4 + tokens de diseño
│   │   ├── page.tsx        Home
│   │   ├── catalogo/       Listado de productos
│   │   ├── producto/[id]/  Ficha de producto
│   │   ├── carrito/        Bolsa
│   │   ├── checkout/       Pago
│   │   ├── pedidos/        Mis pedidos
│   │   ├── login/          Entrar
│   │   ├── registro/       Crear cuenta
│   │   └── api/            BFF — proxy al backend + cookies JWT
│   │       ├── auth/       login, logout, register, me
│   │       ├── carrito/    CRUD carrito
│   │       ├── pedidos/    checkout, listado
│   │       └── pagos/      charge
│   │
│   ├── components/         UI reutilizable (CartView, SiteHeader…)
│   └── lib/
│       ├── api/            Clientes HTTP (browser + server)
│       ├── auth/           Cookies y sesión JWT
│       ├── cart/           Eventos del carrito
│       └── payments/       Integración Culqi en el browser
│
└── next.config.ts          ISR, imágenes Cloudinary, standalone Docker
```

### Flujo de auth en storefront

El navegador llama a `/api/*` (Route Handlers de Next). Next habla con el backend y guarda el JWT en cookie **httpOnly**. El browser no llama al backend directamente para cosas sensibles.

### Estilos

| Archivo | Contenido |
| --- | --- |
| `src/app/globals.css` | Único `.css`: Tailwind, variables, `.btn-pill`, `.glass-nav` |
| Componentes `.tsx` | Clases Tailwind inline |

---

## `admin/` — Panel (puerto 5173)

```
admin/
├── public/                 Favicon, assets estáticos
└── src/
    ├── main.tsx            Entrada Vite
    ├── App.tsx             Rutas (React Router)
    ├── styles.css          Estilos globales del panel
    ├── pages/
    │   ├── LoginPage.tsx   Login admin
    │   ├── ProductsPage.tsx  CRUD productos
    │   └── OrdersPage.tsx  Pedidos + estados en vivo
    ├── components/
    │   ├── AdminLayout.tsx   Barra superior + nav
    │   └── ProtectedRoute.tsx  Solo admin autenticado
    ├── auth/
    │   └── AuthContext.tsx   JWT en sessionStorage
    └── lib/
        ├── api.ts          Cliente HTTP al backend
        ├── socket.ts       Socket.IO (pedidos en vivo)
        ├── session.ts      Persistir token
        └── types.ts        Tipos compartidos
```

### Estilos

| Archivo | Contenido |
| --- | --- |
| `src/styles.css` | Único `.css`: layout, cards, botones, tablas |

El admin llama al backend **desde el browser** con JWT en `sessionStorage`.

---

## `specs/` — Reglas de negocio

```
specs/
├── 00-constitution.md      Principios generales del proyecto
├── glossary.md             Términos (PENDIENTE, cliente, admin…)
├── design-system.md        UI/UX
├── security.md             Auth, cookies, roles
├── auth.md                 Login, registro
├── catalogo.md             Productos, categorías, imágenes
├── carrito.md              Bolsa, stock
├── pedidos-checkout.md     Checkout, estados del pedido
└── pagos.md                Culqi, Mercado Pago
```

Toda funcionalidad nueva debe tener respaldo en `specs/` antes de implementarse.

---

## `plans/` — Diseño técnico

```
plans/
├── architecture.md         Vista general técnica
├── database.md             Esquema y decisiones de BD
└── decisions/              ADRs (Architecture Decision Records)
    ├── 0001-separar-storefront-y-admin.md
    ├── 0002-transacciones-atomicas-para-checkout.md
    ├── 0003-pasarela-de-pago-intercambiable.md
    └── 0004-quitar-whatsapp-baileys.md
```

---

## `tasks/` — Ciclo de trabajo

```
tasks/
├── _template.md            Plantilla para nuevas tasks
├── backlog/                Pendiente
├── in-progress/            En curso
└── done/                   Completadas
```

Cada task incluye `spec_ref` y `plan_ref`. El CI valida que esos archivos existan.

Flujo: `specs/` → `plans/` → `tasks/backlog/` → `in-progress/` → QA → `done/`.

---

## `docs/` — Documentación adicional

```
docs/
├── structura.md            Este archivo
└── solid-propuesta.md      Ejemplos SOLID del backend (antes/después)
```

---

## `deploy/` — Producción

```
deploy/
├── nginx/
│   ├── http.conf.template    nginx sin SSL
│   └── ssl.conf.template     nginx con HTTPS
└── init-letsencrypt.sh       Certificados Let's Encrypt
```

nginx enruta por `Host` a storefront, admin y backend (`STOREFRONT_HOST`, `ADMIN_HOST`, `API_HOST`).

---

## `.claude/` — Agentes y skills (IA)

```
.claude/
├── agents/
│   ├── architect.md        Diseño técnico y descomposición de tasks
│   ├── backend.md          Implementación NestJS
│   ├── frontend-storefront.md  Next.js tienda
│   ├── frontend-admin.md   Panel Vite
│   ├── devops.md           Docker, CI, nginx
│   ├── security.md         Revisión de auth y datos sensibles
│   ├── qa.md               Validación contra specs
│   └── orchestrator.md     Delegación entre agentes
└── skills/
    ├── backend-nestjs/     Convenciones del backend
    ├── storefront-nextjs/  BFF, cookies, ISR
    ├── admin-vite/         sessionStorage, Socket.IO
    ├── payment-gateways/   Culqi / Mercado Pago
    ├── prisma-transactions/  Transacciones atómicas
    └── apple-design/       Motion y UI de la tienda
```

---

## `.github/` — CI

```
.github/workflows/
└── ci.yml
    ├── trazabilidad        Tasks → spec/plan existentes
    ├── backend             lint, test, build
    ├── storefront          lint, build
    └── admin               build
```

---

## Flujo típico de un pedido

1. Cliente entra al **storefront** → catálogo (ISR, server → backend).
2. Login → **storefront `/api/auth`** → **backend `/auth`** → cookie JWT.
3. Agrega al carrito → BFF → **backend `/carrito`**.
4. Checkout → **OrderService** (stock + pedido + vaciar carrito en transacción).
5. Pago → Culqi/MP → **PaymentService** → pedido `PAGADO`.
6. Admin en **admin** recibe el cambio por **OrderGateway** (evento + Socket.IO).

---

## Dónde empezar según qué quieras tocar

| Quieres… | Mira en… |
| --- | --- |
| Reglas de negocio | `specs/` |
| API / base de datos | `backend/src/<modulo>/` |
| Tienda pública | `storefront/src/app/` + `components/` |
| Panel admin | `admin/src/pages/` |
| Estilos tienda | `storefront/src/app/globals.css` |
| Estilos admin | `admin/src/styles.css` |
| Ejemplos SOLID | `docs/solid-propuesta.md` |
| Levantar todo | `README.md` + `docker compose up` |

---

## Resumen por carpeta

| Carpeta | Qué hay |
| --- | --- |
| `backend/src/*/domain` | Entidades + interfaces (contratos) |
| `backend/src/*/application` | Lógica de negocio (services) |
| `backend/src/*/infrastructure` | Prisma, Cloudinary, Culqi/MP |
| `backend/src/*/presentation` | Controllers HTTP + WebSocket |
| `storefront/src/app` | Páginas y rutas API (BFF) |
| `storefront/src/components` | Componentes React de la tienda |
| `admin/src/pages` | Pantallas del panel |
| `specs/` | Qué debe hacer el sistema |
| `plans/` | Cómo está construido |
| `tasks/` | Qué falta o se está haciendo |
