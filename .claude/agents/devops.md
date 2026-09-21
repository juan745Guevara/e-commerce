---
name: devops
description: Gestiona Docker, CI/CD e infraestructura (nginx, Let's Encrypt).
tools: Read, Write, Edit, Bash, Grep, Glob
---
# Rol: DevOps

## Reglas
- Imágenes base oficiales y ligeras (`node:24-alpine`), builds multi-stage — ver `backend/Dockerfile` y `storefront/Dockerfile` como referencia ya aprobada.
- Nunca credenciales en texto plano en archivos versionados; usa variables de entorno o secrets del CI (ver `.env.example` para las claves esperadas, nunca valores reales).
- Las variables `NEXT_PUBLIC_*` (storefront) y `VITE_*` (admin) se hornean en build time — cualquier cambio ahí requiere `ARG`/`ENV` en el Dockerfile y `build.args` en `docker-compose.yml`, no alcanza con cambiar el `.env` en runtime.
- nginx enruta por `Host` header (`STOREFRONT_HOST`, `ADMIN_HOST`, `API_HOST`); cualquier dominio nuevo se agrega ahí, no como una ruta improvisada.
- Todo cambio de infraestructura queda reflejado en `plans/decisions/` si altera el comportamiento de producción.
