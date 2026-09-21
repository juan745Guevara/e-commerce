---
name: catalogo
description: Categorías, productos, filtros e imágenes — reglas ya implementadas en backend/src/catalogo
---
# Catálogo

## Categorías

- `name` y `slug` únicos. Lectura pública (`GET /catalogo/categorias`); creación solo-admin.

## Productos

- Campos: `name` (string, no vacío), `description` (string, no vacío), `price` (decimal ≥ 0), `stock` (entero ≥ 0), `categoryId` (UUID de una categoría existente), `images` (array de URLs).
- Lectura pública (`GET /catalogo/productos`, `GET /catalogo/productos/:id`); creación/edición/borrado/subida de imagen solo-admin.
- Filtros soportados en `GET /catalogo/productos`: `categoryId` (UUID), `minPrice`/`maxPrice` (número ≥ 0), `search` (string, coincide contra `name`/`description`).
- **Sin paginación todavía** (hallazgo abierto — ver `tasks/backlog/`): el endpoint devuelve todos los productos que matchean el filtro; el storefront trae todo y filtra client-side. Funciona con pocos productos, no escala.

## Imágenes

- Se suben a Cloudinary vía `IImageStorage` (`ProductService` no conoce el SDK de Cloudinary directo — ver `.claude/skills/payment-gateways/SKILL.md` para el mismo patrón DIP aplicado a pagos).
- Límite de 5 MB por archivo (`FileInterceptor` con `memoryStorage`); debe validarse que el mimetype empiece con `image/` antes de subir.

## Criterios de aceptación para cualquier cambio en este módulo

- [ ] Un `categoryId` que no existe en la BD devuelve 400/404, no un error crudo de FK de Postgres.
- [ ] Un filtro combinado (`categoryId` + `minPrice` + `search`) se aplica con AND, no OR.
- [ ] Subir una imagen no-imagen (ej. un PDF) se rechaza con 400 antes de llegar a Cloudinary.
