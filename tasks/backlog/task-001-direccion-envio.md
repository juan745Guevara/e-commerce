---
id: task-001-direccion-envio
status: backlog
spec_ref: specs/pedidos-checkout.md
plan_ref: plans/database.md
assigned_agent: backend
depends_on: []
---
# Agregar dirección de envío al pedido

## Objetivo

Hoy `Order` no tiene ningún campo de dirección — un e-commerce real necesita saber a dónde enviar. Agregar captura de dirección de envío en el checkout y persistirla en el pedido.

## Criterios de aceptación
- [ ] Migración de Prisma agrega los campos de dirección a `Order` (o a una tabla relacionada, a decidir en el ADR correspondiente antes de implementar).
- [ ] `POST /pedidos/checkout` exige una dirección válida (DTO con validación) antes de crear el pedido.
- [ ] El storefront pide la dirección en el flujo de checkout, antes de confirmar el pago.
- [ ] Un pedido ya existente sin dirección (datos previos) no rompe el detalle del pedido — se maneja el campo como opcional para pedidos históricos.
