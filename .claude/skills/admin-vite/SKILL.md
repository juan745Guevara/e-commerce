---
name: admin-vite
description: Convenciones del panel admin (Vite + React SPA) — sessionStorage, build-time env vars, Socket.IO. Seguir para cualquier feature nueva del panel.
---
# Vite + React — Panel Admin

1. **Sesión en `sessionStorage`, no cookie.** Es una decisión intencional distinta al storefront (ver ADR de separación storefront/admin) — no la migres a cookie sin registrar un nuevo ADR que lo justifique.
2. **`VITE_*` se hornea en build time.** Solo las variables con prefijo `VITE_` llegan al bundle, y quedan fijas desde el build — cambiar `VITE_API_URL` requiere rebuildear, no solo reiniciar el proceso.
3. **Toda ruta nueva pasa por `ProtectedRoute`**, y cualquier ruta no reconocida redirige a `/` — no agregues una ruta pública sin decidirlo explícitamente.
4. **Sesión se limpia sola en 3 casos:** token expirado, rol distinto de `admin`, o un 401 de la API — no dupliques esa lógica de limpieza en un componente nuevo, reusa `AuthContext`.
5. **Eventos en vivo por el cliente de Socket.IO ya conectado** (autentica el mismo JWT vía `auth.token`/header/query) — si necesitas datos en tiempo real, suscríbete a un evento existente o pide uno nuevo al `architect`, no agregues polling.
