---
id: task-002-cors-whitelist
status: backlog
spec_ref: specs/security.md
plan_ref: plans/architecture.md
assigned_agent: backend
depends_on: []
---
# Reemplazar CORS `origin: true` por whitelist explícita

## Objetivo

`backend/src/main.ts` usa `app.enableCors({ origin: true, credentials: true })`, que refleja cualquier origen como permitido junto con cookies — hallazgo abierto documentado en `specs/security.md`. Reemplazar por una whitelist de orígenes conocidos (storefront, admin, dominios de producción) leída de una variable de entorno.

## Criterios de aceptación
- [ ] `origin` en `main.ts` valida contra una lista explícita (env var, ej. `CORS_ALLOWED_ORIGINS`), no `true`.
- [ ] Una petición con `credentials: true` desde un origen fuera de la whitelist es rechazada por CORS.
- [ ] El storefront y el admin siguen funcionando en local y en Docker sin cambios adicionales (sus orígenes están en la whitelist por default).
- [ ] `specs/security.md` se actualiza quitando este hallazgo de "abierto" una vez resuelto.
