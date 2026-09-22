# Propuesta SOLID — Atelier (backend)

Diez ejemplos del **backend NestJS**, **dos por letra**. Todos son **clases** reales del proyecto.

En cada uno:

- **Antes (sin SOLID)** = una sola clase gorda que hace de todo (inventado).
- **Después (con SOLID)** = cómo está **hoy** en `backend/src/`: varias clases, cada una con un rol.

Código simplificado (sin tipos ni decoradores extra). Los nombres de clase y rutas son los del repo.

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
class PedidosController {
  constructor(orders: OrderService) { this.orders = orders; }

  @Post('checkout')
  checkout(user) {
    return this.orders.checkout(user.id);
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
class CarritoController {
  constructor(cartService: CartService) { this.cartService = cartService; }

  @Post('items')
  addItem(user, dto) {
    return this.cartService.addItem(user.id, dto);
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
// PagosModule — factory
useFactory: (config, http, payers) => {
  const provider = config.get('PAYMENT_PROVIDER') ?? 'culqi';
  if (provider === 'mercadopago') return new MercadoPagoPaymentService(...);
  return new CulqiPaymentService(...);
  // Stripe = clase nueva + rama aquí. PaymentService no se toca.
},

// PaymentService — sin if de proveedor
class PaymentService {
  charge(order, token) {
    return this.gateway.charge(order.total, token, order.id);
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
// OrderService — solo emite
class OrderService {
  changeStatus(id, status) {
    // validar ORDER_TRANSITIONS, guardar...
    this.events.emit('order.status.changed', payload);
  }
}

// OrderGateway — reacciona aparte
class OrderGateway {
  @OnEvent('order.status.changed')
  broadcastStatusChanged(payload) {
    this.server.to('admins').emit('order.status.changed', payload);
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
interface IPaymentGateway {
  charge(amount, token, orderId); // → PaymentResult
}

class CulqiPaymentService implements IPaymentGateway { charge(...) { /* Culqi */ } }
class MercadoPagoPaymentService implements IPaymentGateway { charge(...) { /* MP */ } }

// PaymentService — no pregunta cuál es
class PaymentService {
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
interface IImageStorage {
  upload(file); // → url (string)
}

class CloudinaryService implements IImageStorage {
  upload(file) { /* sube a Cloudinary, devuelve secure_url */ }
}

class ProductService {
  constructor(images: IImageStorage) { this.images = images; }

  addImage(id, file) {
    const url = await this.images.upload(file);
    // guardar url en producto...
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
interface ICartRepository {
  findByUserId(userId);
  upsertItem(cartId, productId, quantity);
  removeItem(cartId, productId);
  clear(cartId);
}

class CartService {
  constructor(carts: ICartRepository) { this.carts = carts; }
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
interface IOrderRepository { findById(id); create(data); updateStatus(id, status); }
interface IPaymentGateway { charge(amount, token, orderId); }
interface ITransactionManager { run(work); }

class OrderService {
  // inyecta IOrderRepository + ITransactionManager + ICartRepository + IProductRepository
  // no ve charge() ni upload()
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
class PaymentService {
  constructor(gateway: IPaymentGateway) { this.gateway = gateway; }

  async charge(order, token) {
    const result = await this.gateway.charge(order.total, token, order.id);
    if (!result.succeeded) throw new BadRequestException('Pago rechazado');
    // marcar pedido PAGADO...
  }
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
interface IUserRepository {
  findByEmail(email);
  findById(id);
  create(data);
}

class AuthService {
  constructor(users: IUserRepository) { this.users = users; }

  async login(email, password) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    // verificar bcrypt, firmar JWT...
  }
}
```

**D:** `AuthService` depende del contrato; PostgreSQL queda en `PrismaUserRepository` (testeable con mock).

---

## Cómo contarlo (~2 min por ejemplo)

1. “Estas **clases** sirven para …”
2. “**Antes**, una sola clase hacía todo” → tabla o bloque **Antes**.
3. “**Después**, en Atelier está partido así” → nombra las clases reales → **Después**.
4. Cierra con la letra: **S, O, L, I o D**.
