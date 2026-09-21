---
id: 4
title: Quitar el notifier de WhatsApp (Baileys) del proyecto
status: aceptada
---
# Contexto

El proyecto tuvo, durante varias semanas, un aviso al cliente por WhatsApp (vía Baileys, una librería que simula WhatsApp Web) cuando un pedido pasaba a `PAGADO` o `ENVIADO`. Baileys depende de escanear un código QR y mantener una sesión de WhatsApp viva en el proceso del backend — poco práctico para desarrollo y demos, y con riesgo de que el número quede baneado en producción (no es la Cloud API oficial de Meta).

# Decisión

Se elimina por completo el módulo `backend/src/notificaciones/` (el `NotificationService`, la interfaz `INotifier` y `WhatsAppBaileysNotifier`) y su registro en `AppModule`, junto con las variables de entorno, el volumen Docker y las menciones de documentación asociadas. No se reemplaza por otro canal (email, SMS) en este cambio — si se necesita en el futuro, es una clase nueva que implemente `INotifier`... salvo que la interfaz misma también se borró junto con el módulo, así que reintroducirla implica recrearla.

# Alternativas descartadas

- Hacerlo opcional vía feature-flag (activar/desactivar por variable de entorno, como se hizo con la pasarela de pago): se descartó explícitamente por el usuario — se prefirió quitarlo del todo en vez de mantener código muerto configurable.
- Reemplazarlo por email en el mismo cambio: se descartó para mantener el cambio acotado a "quitar Baileys", no "agregar un canal nuevo".

# Consecuencias

- **Esto es la prueba práctica de que la Decisión Inversa de Dependencias (DIP) del proyecto funciona de verdad**: `OrderService`, `OrderGateway`, el checkout y el resto del sistema nunca importaron `INotifier` ni supieron que WhatsApp existía — solo reaccionaban a (o emitían) el evento `order.status.changed`. Borrar el módulo completo no requirió tocar ninguno de ellos. Ver `specs/pedidos-checkout.md` y el ejemplo 2 de `docs/solid-propuesta.md`.
- El campo `User.phone` se mantiene (sigue siendo un dato de contacto general opcional), pero ya no implica notificaciones — el copy del storefront que prometía WhatsApp se actualizó.
- Pendiente en el desarrollo local: correr `npm install` en `backend/` para que `package-lock.json` y `node_modules` dejen de referenciar `@whiskeysockets/baileys`, `@hapi/boom` y `qrcode-terminal` (no se pudo completar automáticamente por un bloqueo de archivos en el entorno donde se hizo el cambio).
