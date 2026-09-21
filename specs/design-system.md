---
name: design-system
description: Identidad visual y de UX del storefront — paleta, tipografía, materiales, estados interactivos. El admin no sigue este sistema (ver nota al final).
---
# Design System — Storefront

Inspirado en el lenguaje visual de Apple (ver `.claude/skills/apple-design/SKILL.md` para los principios de interacción/física — este archivo es la identidad visual concreta, ya implementada en `storefront/src/app/globals.css`).

## Color

Tokens en `:root` (light) — el proyecto todavía no tiene variante dark:

- `--background: #ffffff` / `--foreground: #1d1d1f`
- `--surface: #f5f5f7` / `--surface-dim: #e8e8ed`
- `--muted: #6e6e73`
- `--accent: #0071e3` / `--accent-hover: #0077ed`
- `--line: rgba(0, 0, 0, 0.08)`

## Tipografía

Escala con tracking/leading que se ajusta según el tamaño (nunca un solo `letter-spacing` global):

| Clase | Tamaño | Tracking | Leading |
| --- | --- | --- | --- |
| `.text-display` | `clamp(2.75rem, 6vw, 5.5rem)` | `-0.03em` | `1.05` |
| `.text-headline` | `clamp(2rem, 4vw, 3rem)` | `-0.02em` | `1.08` |
| `.text-title` | `clamp(1.375rem, 2vw, 1.75rem)` | `-0.015em` | `1.2` |
| `.text-eyebrow` | `0.9375rem` | `0` | `1.3` |
| `.text-body` | `1.0625rem` | `0.001em` | `1.5` |

Fuente: `"SF Pro Text"` con fallback a `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui`.

## Materiales

`.glass-nav` / `.glass-card`: `backdrop-filter: blur(20px) saturate(180%)`. Nunca apilar dos superficies translúcidas una sobre otra.

## Componentes base

- **Botones** (`.btn-pill` / `.btn-pill-secondary`): pill (`border-radius: 980px`), con `:hover` (cambio de fondo) y `:active` (`scale(0.97)` + fondo hover) — todo elemento interactivo responde en pointer-down, no solo en release.
- **Estados de accesibilidad:** `prefers-reduced-motion` reemplaza animaciones por cross-fades cortos de opacidad (120ms), no un freeze total; `prefers-reduced-transparency` quita el blur y usa fondos sólidos; `prefers-contrast: more` agrega bordes definidos.

## Admin (nota)

El panel de administración (`admin/`, Vite/React) es una SPA de uso interno y **no** sigue este design system — prioriza velocidad de desarrollo y utilidad sobre identidad de marca. No traslades componentes de `apple-design` al admin sin que el usuario lo pida explícitamente.
