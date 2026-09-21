---
name: glossary
description: Términos de negocio compartidos entre specs — evita que cada spec invente su propia nomenclatura
---
# Glosario del dominio (Atelier)

- **Cliente**: usuario con rol `cliente` (default al registrarse). Compra, arma carrito, hace checkout, ve sus propios pedidos.
- **Admin**: usuario con rol `admin` (promovido manualmente). Gestiona catálogo, ve todos los pedidos, cambia su estado.
- **Categoría**: agrupador de productos (`name`, `slug` únicos).
- **Producto**: `name`, `description`, `price` (decimal), `stock` (entero), `images` (URLs de Cloudinary), pertenece a una `Categoría`.
- **Carrito**: uno por usuario (`Cart.userId` único), contiene `CartItem`s (`productId` + `quantity`, único por par carrito-producto).
- **Pedido (Order)**: se crea desde el carrito en el checkout. Tiene `total`, una lista de `OrderItem` (snapshot de `productName`/`unitPrice` al momento de la compra, no una referencia viva al producto) y un `status`.
- **Estado del pedido**: `PENDIENTE` → `PAGADO` → `ENVIADO` → `ENTREGADO`, o `PENDIENTE` → `CANCELADO`. No hay otras transiciones válidas.
- **Checkout**: la operación atómica que decrementa stock, crea el `Order` y vacía el `Carrito` en una sola transacción.
- **Pasarela de pago (Payment Gateway)**: Culqi o Mercado Pago, seleccionada por `PAYMENT_PROVIDER`. Cobra un pedido `PENDIENTE` con un `token` generado por el widget del frontend.
- **Token (de pago)**: representación tokenizada de una tarjeta, generada por el SDK de la pasarela en el navegador — nunca el número de tarjeta crudo llega al backend.
- **BFF (Backend for Frontend)**: los Route Handlers de `storefront/src/app/api/*`, que median entre el navegador y la API real para todo lo sensible a sesión.
