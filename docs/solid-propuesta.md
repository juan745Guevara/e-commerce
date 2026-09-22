# Propuesta SOLID — Atelier (backend)

Diez ejemplos del **backend NestJS**, **dos por letra**. Todos son **clases** reales del proyecto.

En cada uno:

- **Antes (sin SOLID)** = una sola clase gorda que hace de todo (inventado).
- **Después (con SOLID)** = cómo está **hoy** en `backend/src/`: varias clases, cada una con un rol.

Código simplificado (sin tipos ni decoradores extra). En **Después**, el bloque de código muestra **todas** las clases de la tabla — una sección por archivo.

| Letra | Principio | En una frase |
| --- | --- | --- |
| **S** | SRP | Una clase, un trabajo. |
| **O** | OCP | Abierto a extensión, cerrado a modificación. |
| **L** | LSP | Cambias la implementación y quien la usa no se rompe. |
| **I** | ISP | Interfaces chicas: no arrastras métodos que no usas. |
| **D** | DIP | La lógica depende de un contrato, no de Culqi / Prisma. |

| # | Letra | Clases |
| --- | --- | --- |
| 1 | **S** | `PedidosController` → `OrderService` |
| 2 | **S** | `CarritoController` → `CartService` |
| 3 | **O** | `PagosModule` (factory) + pasarelas |
| 4 | **O** | `OrderService` → evento → `OrderGateway` |
| 5 | **L** | `CulqiPaymentService` ↔ `MercadoPagoPaymentService` |
| 6 | **L** | `CloudinaryService` implementa `IImageStorage` |
| 7 | **I** | `ICartRepository` vs interfaz gorda |
| 8 | **I** | `IOrderRepository`, `IPaymentGateway`, `ITransactionManager` |
| 9 | **D** | `PaymentService` → `IPaymentGateway` |
| 10 | **D** | `AuthService` → `IUserRepository` |

---

## 1. Checkout de pedidos — **S**

**Para qué sirve.** El cliente confirma la compra. Alguien recibe HTTP; otro aplica stock, total y crea el pedido.

### Antes (sin SOLID) — una clase

`PedidosController` hace HTTP **y** Prisma **y** reglas de negocio.

```ts
class PedidosController {
  @Post('checkout')
  async checkout(user) {
    const cart = await prisma.cart.findFirst({ where: { userId: user.id } });
    if (!cart.items.length) throw new BadRequestException('Vacío');
    // validar stock, descontar, crear pedido, vaciar carrito...
    return prisma.order.create({ data: { userId: user.id, total: 99 } });
  }
}
```

### Después (con SOLID) — dos clases

| Clase | Archivo | Trabajo |
| --- | --- | --- |
| `PedidosController` | `pedidos/presentation/pedidos.controller.ts` | HTTP: ruta, JWT, delegar |
| `OrderService` | `pedidos/application/services/order.service.ts` | Reglas: checkout, stock, transacción |

```ts
// pedidos/presentation/pedidos.controller.ts
class PedidosController {
  constructor(orders: OrderService) { this.orders = orders; }

  @Post('checkout')
  checkout(user) {
    return this.orders.checkout(user.id);
  }
}

// pedidos/application/services/order.service.ts
class OrderService {
  constructor(carts, products, orders, transactions) { ... }

  async checkout(userId) {
    const cart = await this.carts.findByUserId(userId);
    if (!cart?.items.length) throw new BadRequestException('El carrito está vacío');

    return this.transactions.run(async (tx) => {
      for (const item of cart.items) {
        const ok = await this.products.decrementStock(item.productId, item.quantity, tx);
        if (!ok) throw new BadRequestException('Stock insuficiente');
      }
      const order = await this.orders.create({ userId, total, items }, tx);
      await this.carts.clear(cart.id, tx);
      return order;
    });
  }
}
```

**S:** si cambia la API REST, tocas el controller. Si cambia la regla de checkout, tocas `OrderService`.

---

## 2. Carrito — **S**

**Para qué sirve.** Ver la bolsa, agregar ítems, validar stock.

### Antes (sin SOLID) — una clase

`CarritoController` valida stock, habla con Prisma y arma la respuesta en cada ruta.

```ts
class CarritoController {
  @Post('items')
  async addItem(user, dto) {
    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (product.stock < dto.quantity) throw new BadRequestException('Sin stock');
    // upsert cart item, recalcular total...
  }
}
```

### Después (con SOLID) — dos clases

| Clase | Archivo | Trabajo |
| --- | --- | --- |
| `CarritoController` | `carrito/presentation/carrito.controller.ts` | HTTP: GET/POST/PATCH/DELETE |
| `CartService` | `carrito/application/services/cart.service.ts` | Reglas: stock, upsert, quitar |

```ts
// carrito/presentation/carrito.controller.ts
class CarritoController {
  constructor(cartService: CartService) { this.cartService = cartService; }

  @Post('items')
  addItem(user, dto) {
    return this.cartService.addItem(user.id, dto);
  }
}

// carrito/application/services/cart.service.ts
class CartService {
  constructor(carts, products) { ... }

  async addItem(userId, dto) {
    const cart = await this.getOrCreate(userId);
    const product = await this.products.findById(dto.productId);
    if (product.stock < dto.quantity) throw new BadRequestException('Sin stock');

    return this.carts.upsertItem(cart.id, product.id, dto.quantity);
  }
}
```

**S:** el controller no sabe de stock ni de tablas; `CartService` no sabe de rutas HTTP.

---

## 3. Pasarelas de pago — **O**

**Para qué sirve.** Cobrar con Culqi o Mercado Pago según `.env`. Mañana puede entrar otra pasarela.

### Antes (sin SOLID) — una clase

`PaymentService` conoce cada proveedor por dentro.

```ts
class PaymentService {
  async charge(order, token) {
    if (provider === 'culqi') { /* HTTP Culqi */ }
    else if (provider === 'mercadopago') { /* HTTP MP */ }
    else if (provider === 'stripe') { /* otra vez aquí */ }
  }
}
```

### Después (con SOLID) — factory + clases por proveedor

| Clase | Archivo | Trabajo |
| --- | --- | --- |
| `PaymentService` | `pagos/application/services/payment.service.ts` | Caso de uso: cobrar pedido PENDIENTE |
| `PagosModule` | `pagos/pagos.module.ts` | Factory: elige pasarela según env |
| `CulqiPaymentService` | `pagos/infrastructure/culqi-payment.service.ts` | Implementación Culqi |
| `MercadoPagoPaymentService` | `pagos/infrastructure/mercadopago-payment.service.ts` | Implementación MP |

```ts
// pagos/pagos.module.ts — factory elige la pasarela
useFactory: (config, http, payers) => {
  const provider = config.get('PAYMENT_PROVIDER') ?? 'culqi';
  if (provider === 'mercadopago') return new MercadoPagoPaymentService(http, config, payers);
  return new CulqiPaymentService(http, config, payers);
  // Stripe = clase nueva + rama aquí
},

// pagos/application/services/payment.service.ts
class PaymentService {
  constructor(gateway: IPaymentGateway) { this.gateway = gateway; }

  charge(order, token) {
    return this.gateway.charge(order.total, token, order.id);
  }
}

// pagos/infrastructure/culqi-payment.service.ts
class CulqiPaymentService implements IPaymentGateway {
  charge(amount, token, orderId) {
    return this.http.post('https://api.culqi.com/v2/charges', { ... });
  }
}

// pagos/infrastructure/mercadopago-payment.service.ts
class MercadoPagoPaymentService implements IPaymentGateway {
  charge(amount, token, orderId) {
    return this.http.post('https://api.mercadopago.com/...', { ... });
  }
}
```

**O:** pasarela nueva = clase nueva + rama en el factory. `PaymentService` queda cerrado.

---

## 4. Cambio de estado del pedido — **O**

**Para qué sirve.** Admin cambia `PENDIENTE` → `PAGADO` → `ENVIADO`. El panel recibe el cambio en vivo.

### Antes (sin SOLID) — una clase

`OrderService.changeStatus` conoce socket, email y lo que venga.

```ts
class OrderService {
  async changeStatus(id, status) {
    await this.orders.updateStatus(id, status);
    await this.socket.emitToAdmins(...);
    await this.email.send(...); // cada canal nuevo → editar aquí
  }
}
```

### Después (con SOLID) — emisor + listeners

| Clase | Archivo | Trabajo |
| --- | --- | --- |
| `OrderService` | `pedidos/application/services/order.service.ts` | Valida transición, guarda, **emite evento** |
| `OrderGateway` | `pedidos/presentation/order.gateway.ts` | **Escucha** evento → Socket.IO a admins |
| (futuro) `EmailListener` | otro módulo | **Escucha** evento → envía mail |

```ts
// pedidos/application/services/order.service.ts
class OrderService {
  changeStatus(id, status) {
    if (!canTransition(actual, status)) throw new BadRequestException(...);
    const updated = await this.orders.updateStatus(id, status);
    this.events.emit('order.status.changed', {
      orderId: updated.id,
      userId: updated.userId,
      status: updated.status,
    });
    return updated;
  }
}

// pedidos/presentation/order.gateway.ts
class OrderGateway {
  @OnEvent('order.status.changed')
  broadcastStatusChanged(payload) {
    this.server.to('admins').emit('order.status.changed', payload);
  }
}

// (futuro) notificaciones/email.listener.ts
class EmailListener {
  @OnEvent('order.status.changed')
  sendStatusEmail(payload) {
    // this.mailer.send(payload.userId, payload.status);
  }
}
```

**O:** canal nuevo = clase listener nueva. `OrderService` no se reescribe.

---

## 5. Culqi ↔ Mercado Pago — **L**

**Para qué sirve.** Misma operación de cobro; distinto proveedor según configuración.

### Antes (sin SOLID) — el caller distingue clases

```ts
class PaymentService {
  async charge(order, token) {
    if (this.gateway instanceof CulqiPaymentService) {
      await this.gateway.chargeCulqi(...);
    } else {
      await this.gateway.chargeMercadoPago(...);
    }
  }
}
```

### Después (con SOLID) — contrato + implementaciones intercambiables

| Clase / interfaz | Archivo |
| --- | --- |
| `IPaymentGateway` | `pagos/domain/interfaces/payment-gateway.interface.ts` |
| `CulqiPaymentService` | `pagos/infrastructure/culqi-payment.service.ts` |
| `MercadoPagoPaymentService` | `pagos/infrastructure/mercadopago-payment.service.ts` |

```ts
// pagos/domain/interfaces/payment-gateway.interface.ts
interface IPaymentGateway {
  charge(amount, token, orderId); // → PaymentResult { succeeded, chargeId? }
}

// pagos/infrastructure/culqi-payment.service.ts
class CulqiPaymentService implements IPaymentGateway {
  charge(amount, token, orderId) {
    // HTTP a api.culqi.com → { succeeded: true, chargeId: '...' }
  }
}

// pagos/infrastructure/mercadopago-payment.service.ts
class MercadoPagoPaymentService implements IPaymentGateway {
  charge(amount, token, orderId) {
    // HTTP a Mercado Pago → mismo PaymentResult
  }
}

// pagos/application/services/payment.service.ts
class PaymentService {
  constructor(gateway: IPaymentGateway) { this.gateway = gateway; }

  charge(order, token) {
    const result = await this.gateway.charge(order.total, token, order.id);
    if (!result.succeeded) throw new BadRequestException('Pago rechazado');
  }
}
```

**L:** Nest inyecta Culqi o MP; `PaymentService` solo mira `result.succeeded`.

---

## 6. Subida de imágenes — **L**

**Para qué sirve.** Foto del producto en el catálogo. Hoy Cloudinary; mañana podría ser S3.

### Antes (sin SOLID) — clase acoplada al proveedor

```ts
class ProductService {
  async addImage(id, file) {
    const url = await cloudinary.uploader.upload(file);
    await prisma.product.update({ where: { id }, data: { image: url } });
  }
}
```

### Después (con SOLID) — contrato + adaptador

| Clase / interfaz | Archivo |
| --- | --- |
| `IImageStorage` | `catalogo/domain/interfaces/image-storage.interface.ts` |
| `CloudinaryService` | `catalogo/infrastructure/cloudinary/cloudinary.service.ts` |
| `ProductService` | `catalogo/application/services/product.service.ts` |

```ts
// catalogo/domain/interfaces/image-storage.interface.ts
interface IImageStorage {
  upload(file); // → url (string)
}

// catalogo/infrastructure/cloudinary/cloudinary.service.ts
class CloudinaryService implements IImageStorage {
  upload(file) {
    // cloudinary.uploader.upload_stream → secure_url
  }
}

// catalogo/application/services/product.service.ts
class ProductService {
  constructor(images: IImageStorage, products) { this.images = images; }

  addImage(id, file) {
    const url = await this.images.upload(file);
    return this.products.update(id, { image: url });
  }
}
```

**L:** `S3ImageStorage implements IImageStorage` reemplaza a Cloudinary sin tocar `ProductService`.

---

## 7. Repositorio del carrito — **I**

**Para qué sirve.** Persistir ítems de la bolsa. El carrito no necesita métodos de pedidos ni de usuarios.

### Antes (sin SOLID) — interfaz gorda

```ts
interface IEcommerceRepository {
  findUser(...);
  upsertCartItem(...);
  createOrder(...);
  updateOrderStatus(...);
  decrementStock(...);
}

class CartService {
  constructor(repo: IEcommerceRepository) { ... } // arrastra métodos que no usa
}
```

### Después (con SOLID) — interfaz mínima

| Clase / interfaz | Archivo |
| --- | --- |
| `ICartRepository` | `carrito/domain/interfaces/cart-repository.interface.ts` |
| `PrismaCartRepository` | `carrito/infrastructure/repositories/prisma-cart.repository.ts` |
| `CartService` | `carrito/application/services/cart.service.ts` |

```ts
// carrito/domain/interfaces/cart-repository.interface.ts
interface ICartRepository {
  findByUserId(userId);
  upsertItem(cartId, productId, quantity);
  removeItem(cartId, productId);
  clear(cartId);
}

// carrito/infrastructure/repositories/prisma-cart.repository.ts
class PrismaCartRepository implements ICartRepository {
  findByUserId(userId) {
    return this.prisma.cart.findUnique({ where: { userId }, include: { items: true } });
  }
  upsertItem(cartId, productId, quantity) { /* prisma.cartItem.upsert */ }
  // removeItem, clear...
}

// carrito/application/services/cart.service.ts
class CartService {
  constructor(carts: ICartRepository) { this.carts = carts; }

  addItem(userId, dto) {
    return this.carts.upsertItem(cart.id, dto.productId, dto.quantity);
  }
}
```

**I:** `CartService` solo ve operaciones de carrito, no toda la base de datos.

---

## 8. Interfaces por responsabilidad — **I**

**Para qué sirve.** Pedidos, pagos y transacciones son cosas distintas. Cada service inyecta solo lo suyo.

### Antes (sin SOLID) — un puerto con todo

```ts
interface IInfra {
  charge(...);
  refund(...);
  upload(...);
  runTransaction(...);
  findOrder(...);
}
```

### Después (con SOLID) — un contrato por trabajo

| Interfaz | Archivo | Método principal |
| --- | --- | --- |
| `IOrderRepository` | `pedidos/domain/interfaces/order-repository.interface.ts` | CRUD de pedidos |
| `IPaymentGateway` | `pagos/domain/interfaces/payment-gateway.interface.ts` | `charge` |
| `ITransactionManager` | `shared/domain/interfaces/transaction-manager.interface.ts` | `run` |

```ts
// pedidos/domain/interfaces/order-repository.interface.ts
interface IOrderRepository {
  findById(id);
  create(data);
  updateStatus(id, status);
}

// pagos/domain/interfaces/payment-gateway.interface.ts
interface IPaymentGateway {
  charge(amount, token, orderId);
}

// shared/domain/interfaces/transaction-manager.interface.ts
interface ITransactionManager {
  run(work);
}

// pedidos/application/services/order.service.ts
class OrderService {
  constructor(orders: IOrderRepository, transactions: ITransactionManager, ...) { ... }
  // usa orders + transactions — no ve charge() ni upload()
}

// pagos/application/services/payment.service.ts
class PaymentService {
  constructor(gateway: IPaymentGateway, orders: IOrderRepository) { ... }
  // usa gateway.charge — no ve upsertItem ni run()
}
```

**I:** cada clase depende del pedazo de interfaz que realmente usa.

---

## 9. Cobro sin conocer Culqi — **D**

**Para qué sirve.** Confirmar pago de un pedido `PENDIENTE`. El proveedor lo elige `.env`, no el caso de uso.

### Antes (sin SOLID) — lógica pegada a Culqi

```ts
class PaymentService {
  async charge(order, token) {
    const res = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: { Authorization: 'Bearer sk_test_...' },
      body: JSON.stringify({ amount: order.total, source_id: token }),
    });
    return res.json();
  }
}
```

### Después (con SOLID) — caso de uso → abstracción → implementación

| Capa | Clase | Archivo |
| --- | --- | --- |
| Application | `PaymentService` | `pagos/application/services/payment.service.ts` |
| Domain | `IPaymentGateway` | `pagos/domain/interfaces/payment-gateway.interface.ts` |
| Infrastructure | `CulqiPaymentService` / `MercadoPagoPaymentService` | `pagos/infrastructure/` |

```ts
// pagos/application/services/payment.service.ts — application
class PaymentService {
  constructor(gateway: IPaymentGateway) { this.gateway = gateway; }

  async charge(order, token) {
    const result = await this.gateway.charge(order.total, token, order.id);
    if (!result.succeeded) throw new BadRequestException('Pago rechazado');
    await this.orderService.changeStatus(order.id, 'PAGADO');
  }
}

// pagos/domain/interfaces/payment-gateway.interface.ts — domain
interface IPaymentGateway {
  charge(amount, token, orderId);
}

// pagos/infrastructure/culqi-payment.service.ts — infrastructure
class CulqiPaymentService implements IPaymentGateway {
  charge(amount, token, orderId) {
    return this.http.post('https://api.culqi.com/v2/charges', {
      headers: { Authorization: `Bearer ${secret}` },
      body: { amount, source_id: token },
    });
  }
}

// pagos/infrastructure/mercadopago-payment.service.ts — infrastructure
class MercadoPagoPaymentService implements IPaymentGateway {
  charge(amount, token, orderId) { /* otra API, mismo contrato */ }
}
```

**D:** `PaymentService` (alto nivel) no importa URLs ni API keys; eso vive en infrastructure.

---

## 10. Login sin conocer Prisma — **D**

**Para qué sirve.** Registrar e iniciar sesión. Auth busca email y hashea password; no escribe SQL.

### Antes (sin SOLID) — service acoplado a Prisma

```ts
class AuthService {
  constructor(prisma: PrismaService) { this.prisma = prisma; }

  async login(email, password) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException();
    // verificar bcrypt, firmar JWT...
  }
}
```

### Después (con SOLID) — caso de uso → abstracción → adaptador

| Capa | Clase | Archivo |
| --- | --- | --- |
| Application | `AuthService` | `auth/application/services/auth.service.ts` |
| Domain | `IUserRepository` | `auth/domain/interfaces/user-repository.interface.ts` |
| Infrastructure | `PrismaUserRepository` | `auth/infrastructure/repositories/prisma-user.repository.ts` |

```ts
// auth/application/services/auth.service.ts — application
class AuthService {
  constructor(users: IUserRepository) { this.users = users; }

  async login(email, password) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    // verificar bcrypt, firmar JWT...
  }
}

// auth/domain/interfaces/user-repository.interface.ts — domain
interface IUserRepository {
  findByEmail(email);
  findById(id);
  create(data);
}

// auth/infrastructure/repositories/prisma-user.repository.ts — infrastructure
class PrismaUserRepository implements IUserRepository {
  findByEmail(email) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  findById(id) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  create(data) {
    return this.prisma.user.create({ data });
  }
}
```

**D:** `AuthService` depende del contrato; PostgreSQL queda en `PrismaUserRepository` (testeable con mock).

---

## Cómo contarlo (~2 min por ejemplo)

1. “Estas **clases** sirven para …”
2. “**Antes**, una sola clase hacía todo” → tabla o bloque **Antes**.
3. “**Después**, en Atelier está partido así” → recorre **cada clase** del bloque de código.
4. Cierra con la letra: **S, O, L, I o D**.
