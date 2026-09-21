---
name: security
description: Reglas de seguridad específicas — pagos y PII. Este proyecto se marcó como riesgo elevado por manejar cobros y datos personales.
---
# Seguridad (Atelier)

Este proyecto maneja pagos (Culqi/Mercado Pago) y datos personales (email, teléfono, contraseña) — por eso tiene spec y agente de seguridad dedicados, además de lo que ya cubre `specs/00-constitution.md`.

## Ya implementado

- Contraseñas hasheadas con `bcrypt` (nunca en texto plano, nunca en logs).
- JWT con expiración de 7 días; guard (`JwtAuthGuard`) + `RolesGuard`/`@Roles()` en cada endpoint que lo requiere.
- El backend nunca recibe el número de tarjeta crudo — solo el `token` que emite el widget de la pasarela en el navegador.
- `CULQI_SECRET_KEY` / `MERCADOPAGO_ACCESS_TOKEN` viven solo en el backend (nunca se exponen a storefront/admin); las claves `NEXT_PUBLIC_*` que sí llegan al navegador son deliberadamente las **públicas** de la pasarela.
- Body validado y saneado globalmente (`whitelist: true, forbidNonWhitelisted: true`) — un campo no declarado en el DTO se rechaza, no se ignora silenciosamente.
- `ParseUUIDPipe` en todo `:id` de ruta — un id mal formado es 400, no llega a Prisma como string arbitrario.

## Hallazgos abiertos (no resueltos — no asumir que ya están arreglados)

- **CORS demasiado permisivo.** `backend/src/main.ts` usa `app.enableCors({ origin: true, credentials: true })`. `origin: true` refleja cualquier dominio que pida la petición; combinado con `credentials: true` (cookies), esto permite que un sitio malicioso haga peticiones autenticadas usando la sesión de un visitante. Corrección esperada: whitelist explícita de orígenes (storefront, admin, dominios de producción) vía variable de entorno.
- **Sin rate limiting.** `/auth/login` y `/auth/register` no tienen ningún límite de intentos — expuestos a fuerza bruta. No hay `@nestjs/throttler` ni equivalente instalado todavía.
- **Sin Helmet / headers de seguridad HTTP.** No hay `helmet()` ni configuración manual de headers (`X-Content-Type-Options`, `Strict-Transport-Security`, etc.) en `main.ts`.

## Reglas para cualquier feature nueva

- Un endpoint nuevo que mute datos SIEMPRE lleva `@UseGuards(JwtAuthGuard)` como mínimo; si es admin-only, además `@UseGuards(RolesGuard)` + `@Roles('admin')`.
- Cualquier dato de tarjeta o pasarela que aparezca en un log o en una respuesta de error es un bug de seguridad, no un detalle de implementación — bloquea la task.
- Un campo nuevo con PII (teléfono, dirección, etc.) en el modelo `User`/`Order` se documenta en `specs/glossary.md` y se revisa contra la constitución antes de exponerse en un DTO de respuesta.
