---
id: task-003-paginacion-catalogo
status: backlog
spec_ref: specs/catalogo.md
plan_ref: plans/architecture.md
assigned_agent: backend
depends_on: []
---
# Paginar GET /catalogo/productos

## Objetivo

El endpoint devuelve todos los productos que matchean el filtro sin límite, y el storefront trae todo y filtra client-side (`catalog-explorer.tsx`). No escala más allá de un catálogo pequeño.

## Criterios de aceptación
- [ ] `QueryProductsDto` acepta `page`/`limit` (con default y tope razonable, ej. máx. 50 por página).
- [ ] La respuesta incluye metadata de paginación (`total`, `page`, `totalPages` o equivalente).
- [ ] El storefront consume la paginación en vez de traer todo el catálogo de una vez (puede ser scroll infinito o paginación clásica, a decidir con el agente `frontend-storefront`).
- [ ] Los filtros existentes (`categoryId`, `minPrice`, `maxPrice`, `search`) siguen funcionando combinados con la paginación.
