---
id: 2
title: Usar ITransactionManager + updates condicionales en vez de leer-luego-escribir para el stock
status: aceptada
---
# Contexto

El checkout original decrementaba stock leyendo el valor actual y escribiendo el nuevo valor en pasos separados. Bajo dos checkouts concurrentes sobre el mismo producto con stock justo, ambos podían leer el mismo stock "disponible" antes de que ninguno escribiera, resultando en overselling (race condition / TOCTOU).

# Decisión

- Todo el checkout (decremento de stock por ítem + creación del pedido + vaciado del carrito) corre dentro de una única transacción Prisma, abstraída detrás de `ITransactionManager` (`application/` no conoce Prisma).
- El decremento de stock usa un update condicional atómico: `updateMany({ where: { id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })`, verificando `result.count === 1`. Si no alcanza el stock, se lanza una excepción dentro de la transacción, lo que hace rollback de TODO (otros ítems ya decrementados incluidos).
- El mismo patrón (`incrementStock`) se usa para reponer stock al cancelar un pedido `PENDIENTE`.

# Alternativas descartadas

- Bloqueo pesimista (`SELECT ... FOR UPDATE`) por producto: funcionaría, pero es más código y peor throughput bajo carga que un `UPDATE` condicional de una sola sentencia.
- Reintentos optimistas con versión (`version` column + retry): más complejidad de la que amerita el tamaño actual del proyecto.

# Consecuencias

- Dos checkouts concurrentes sobre el mismo producto nunca pueden dejarlo con stock negativo.
- Cualquier escritura multi-paso nueva que deba ser atómica sigue el mismo patrón (`transactions.run(...)`), no reinventa su propia lógica de rollback.
