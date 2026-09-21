---
name: prisma-transactions
description: Cómo el proyecto abstrae transacciones y updates atómicos con Prisma — usar este patrón para cualquier escritura multi-paso.
---
# Prisma 6 + PostgreSQL: transacciones atómicas

1. **`ITransactionManager`, no `prisma.$transaction` directo desde `application/`.** `shared/domain/interfaces/transaction-manager.interface.ts` define `run<T>(work: (tx: unknown) => Promise<T>): Promise<T>`; la implementación (`PrismaTransactionManager`) vive en `infrastructure/`. `application/` solo conoce la interfaz.
2. **`tx` es opaco y se pasa a cada repo.** Los métodos de repositorio que participan en una transacción aceptan `tx?: unknown` como último parámetro; el repo internamente hace `(tx as Prisma.TransactionClient | undefined) ?? this.prisma`.
3. **Updates condicionales para evitar race conditions**, no read-then-write. Ej. `decrementStock`: `updateMany({ where: { id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })` y revisar `result.count === 1` — nunca leer el stock, restar en memoria y hacer `update`.
4. **Lanzar dentro del callback de `run()` hace rollback automático.** No captures el error y sigas: si algo debe abortar toda la operación (ej. stock insuficiente en el ítem 3 de 5), lanza la excepción de Nest ahí mismo.
5. **Regenerar el cliente tras tocar el schema.** `npx prisma generate` después de cualquier cambio en `backend/prisma/schema.prisma`, y una migración (`prisma migrate dev`) antes de asumir que el campo ya existe en la DB.
