---
id: task-005-tests-unitarios-checkout
status: backlog
spec_ref: specs/pedidos-checkout.md
plan_ref: plans/decisions/0002-transacciones-atomicas-para-checkout.md
assigned_agent: qa
depends_on: []
---
# Tests unitarios para OrderService.checkout y changeStatus

## Objetivo

Fuera del boilerplate de Nest, el proyecto no tiene ninguna prueba real. `OrderService` es el mejor candidato para el primer test real: el patrón de tokens de DI (`PRODUCT_REPOSITORY`, `TRANSACTION_MANAGER`) está pensado exactamente para poder mockear repositorios sin tocar Prisma ni una base de datos real.

## Criterios de aceptación
- [ ] Test de `checkout()`: camino feliz (stock suficiente, pedido creado, carrito vaciado).
- [ ] Test de `checkout()`: stock insuficiente en un ítem aborta toda la operación (ningún otro ítem queda decrementado).
- [ ] Test de `checkout()`: carrito vacío lanza `BadRequestException` sin llegar a la transacción.
- [ ] Test de `changeStatus()`: transición inválida (ej. `ENTREGADO → CANCELADO`) se rechaza.
- [ ] Test de `changeStatus()`: cancelar un pedido `PENDIENTE` repone el stock de cada ítem.
- [ ] Todos los repositorios y `ITransactionManager` están mockeados — ningún test toca Prisma real.
