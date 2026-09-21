---
name: constitution
description: Principios no negociables del proyecto — se aplican aunque una spec puntual no los mencione
---
# Constitución del proyecto (Atelier)

Reglas que ningún agente puede violar aunque una spec puntual lo sugiera o calle al respecto. Todas describen lo que el código YA hace hoy, salvo donde se marca explícitamente como "pendiente".

- Todo endpoint que muta datos requiere autenticación real vía JWT (`JwtAuthGuard`), no solo la presencia de un header.
- Los endpoints solo-admin exigen `@Roles('admin')` + `RolesGuard`, nunca una comprobación manual dispersa en el controller o el service.
- `application/` nunca importa Prisma directo — todo acceso a datos pasa por una interfaz de repositorio inyectada por token string (ver `.claude/skills/backend-nestjs/SKILL.md`).
- Cualquier escritura de varios pasos que deba ser atómica (checkout, cancelación con reposición de stock) va detrás de `ITransactionManager` — nunca queda a medias.
- Ningún secreto o credencial (JWT_SECRET, CULQI_SECRET_KEY, MERCADOPAGO_ACCESS_TOKEN, credenciales de Postgres/Cloudinary) se versiona en el repositorio; viven en `.env` (ignorado por git) con su plantilla en `.env.example`.
- Las respuestas de error nunca exponen trazas internas de Nest/Prisma ni rutas de servidor al cliente.
- El registro público siempre crea rol `cliente`; promover a `admin` es una acción manual (hoy vía SQL), nunca algo que el usuario pueda pedir desde la API.
- **Pendiente (hallazgo abierto, no resuelto todavía):** `main.ts` configura CORS con `origin: true` + `credentials: true`, lo que refleja cualquier origen como permitido junto con cookies — es una violación de esta constitución en la práctica. Ver `specs/security.md`. Ninguna task nueva debe copiar este patrón; al tocar `main.ts` por otro motivo, hay que corregirlo.
