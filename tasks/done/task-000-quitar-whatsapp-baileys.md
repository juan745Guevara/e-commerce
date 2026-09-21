---
id: task-000-quitar-whatsapp-baileys
status: done
spec_ref: specs/pedidos-checkout.md
plan_ref: plans/decisions/0004-quitar-whatsapp-baileys.md
assigned_agent: backend
depends_on: []
---
# Quitar el notifier de WhatsApp (Baileys) del proyecto

## Objetivo

Eliminar por completo el módulo de notificaciones por WhatsApp (Baileys): dependía de escanear un QR y mantener una sesión viva, poco práctico para el proyecto. Ver `plans/decisions/0004-quitar-whatsapp-baileys.md` para el porqué completo.

## Criterios de aceptación
- [x] `backend/src/notificaciones/` (service, interfaz `INotifier`, `WhatsAppBaileysNotifier`) borrado y desregistrado de `AppModule`.
- [x] Dependencias `@whiskeysockets/baileys`, `@hapi/boom`, `qrcode-terminal` quitadas de `backend/package.json`.
- [x] `docker-compose.yml`, `Dockerfile`, `.env.example`, `.gitignore` sin referencias a `WHATSAPP_SESSION_PATH`/`wa-auth`.
- [x] Copy del storefront (home, registro) actualizado — ya no promete avisos por WhatsApp.
- [x] READMEs y `CLAUDE.md` actualizados para no describir una funcionalidad inexistente.
- [x] `OrderService`, `OrderGateway` y el checkout no requirieron ningún cambio — prueba de que el desacople (DIP) funcionaba de verdad.
