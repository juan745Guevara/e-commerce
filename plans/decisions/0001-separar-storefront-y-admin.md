---
id: 1
title: Separar storefront (Next.js) y admin (Vite/React) en dos apps independientes
status: aceptada
---
# Contexto

El proyecto necesita una vitrina pública (SEO, catálogo, checkout) y un panel de administración (gestión de catálogo, pedidos). Ambos consumen la misma API, pero tienen audiencias, requisitos y superficie de riesgo muy distintos.

# Decisión

Dos aplicaciones frontend separadas, cada una con su stack óptimo para su caso de uso:

- `storefront/`: Next.js 16 (App Router), para SSR/ISR y SEO en páginas públicas de catálogo.
- `admin/`: Vite + React + React Router, SPA liviana para un panel interno sin necesidad de SEO ni SSR.

Ambas hablan con el mismo backend NestJS, pero con manejo de sesión distinto a propósito: cookie httpOnly en storefront (navegador anónimo, más expuesto), `sessionStorage` en admin (usuarios ya autenticados de confianza).

# Alternativas descartadas

- Una sola app Next.js sirviendo tanto la tienda como el panel admin bajo rutas distintas: se descartó porque mezclaría el bundle público (visible a cualquiera) con lógica y dependencias de administración, aumentando la superficie de ataque innecesariamente.

# Consecuencias

- Se puede escalar/desplegar el storefront (más tráfico) independiente del admin (pocos usuarios).
- Un bug o vulnerabilidad en el código público no tiene acceso directo al bundle ni a las rutas del panel admin.
- Costo: dos configuraciones de build, dos Dockerfiles, dos sets de variables de entorno que mantener sincronizados con la API.
