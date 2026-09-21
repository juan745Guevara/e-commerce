---
name: auth
description: Registro, login y roles — reglas ya implementadas en backend/src/auth
---
# Auth

## Registro (`POST /auth/register`)

- `email`: formato válido, único (constraint de BD).
- `password`: string, mínimo 8 caracteres. Se guarda hasheada (`bcrypt`), nunca en texto plano.
- `phone`: opcional; si se manda, debe matchear `^\+?[0-9]{8,15}$` (formato internacional, ej. `51999999999`).
- Todo registro público crea rol `cliente` — no existe una vía en la API para auto-registrarse como `admin`.

## Login (`POST /auth/login`)

- `email` + `password` (mínimo 8 caracteres). Credenciales inválidas → 401, sin distinguir si falló el email o el password (para no filtrar qué emails existen).
- Devuelve un JWT válido por 7 días.

## Roles

- `cliente`: puede operar su propio carrito, hacer checkout, ver y pagar sus propios pedidos.
- `admin`: además puede gestionar categorías/productos, ver todos los pedidos y cambiar su estado.
- Promoción a `admin` es manual (hoy, `UPDATE "User" SET role = 'admin'` directo en SQL) — no hay endpoint para ello. Si se agrega uno, debe requerir que quien promueve ya sea `admin` (nunca auto-promoción).

## Criterios de aceptación para cualquier cambio en este módulo

- [ ] Un email duplicado en registro devuelve un error claro (409 o 400), no un 500 de constraint de BD sin manejar.
- [ ] El JWT emitido incluye `sub` (userId) y `role`, y `RolesGuard` los usa sin volver a golpear la base de datos en cada request.
- [ ] Ningún endpoint de auth devuelve el `passwordHash` en la respuesta, ni siquiera a un admin.
