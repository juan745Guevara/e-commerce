---
id: task-004-rate-limiting-auth
status: backlog
spec_ref: specs/security.md
plan_ref: plans/architecture.md
assigned_agent: backend
depends_on: []
---
# Rate limiting en /auth/login y /auth/register

## Objetivo

No hay ningún límite de intentos en los endpoints de auth — expuestos a fuerza bruta. Agregar `@nestjs/throttler` (o equivalente) con un límite razonable por IP/usuario.

## Criterios de aceptación
- [ ] `/auth/login` rechaza (429) tras N intentos fallidos en una ventana de tiempo configurable.
- [ ] `/auth/register` tiene un límite similar para evitar registro masivo automatizado.
- [ ] El límite no afecta el uso normal (un usuario que se equivoca una vez no queda bloqueado).
- [ ] `specs/security.md` se actualiza quitando este hallazgo de "abierto" una vez resuelto.
