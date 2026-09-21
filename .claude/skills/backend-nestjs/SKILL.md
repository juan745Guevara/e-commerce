---
name: backend-nestjs
description: Convenciones de NestJS + Clean Architecture ya establecidas en backend/src — seguirlas al agregar o tocar un módulo.
---
# NestJS (ESM) + Clean Architecture por módulo

1. **Layout fijo de 4 capas.** Todo módulo vive en `backend/src/<modulo>/domain|application|infrastructure|presentation/`. `domain/` no importa nada de Nest ni de Prisma — solo entidades, interfaces y tokens.
2. **Inyección por token string.** Cada interfaz de repositorio exporta su tipo TS y una constante token (`export const ORDER_REPOSITORY = 'IOrderRepository'`). El módulo la liga a la clase concreta en `providers`, y `application/` la inyecta con `@Inject(TOKEN)` — nunca `new PrismaOrderRepository()` a mano ni una clase Prisma importada directo en un service.
3. **Imports ESM con `.js`.** El proyecto es `"type": "module"` — todo import relativo interno lleva extensión `.js` aunque el archivo sea `.ts` (`import { X } from './x.service.js'`).
4. **Validación global ya activa.** `main.ts` usa `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` — cualquier DTO nuevo debe tener sus decoradores de `class-validator`, no validación manual en el controller.
5. **Cross-module por servicio/token exportado, no por modelo Prisma ajeno.** Si `pedidos` necesita leer del carrito, inyecta `CART_REPOSITORY` (exportado por `CarritoModule`), no importa el modelo `Cart` de Prisma directo.
