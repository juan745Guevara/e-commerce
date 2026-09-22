# Propuesta SOLID — Atelier

Diez ejemplos, **dos por letra**. En cada uno:

- **Mal** = cómo se vería sin esa letra (inventado).
- **Bien** = lo que **ya tiene el proyecto**.

Los ejemplos omiten tipos y decoradores que no aportan a la idea. Las rutas apuntan al código real.

| Letra | Principio | En una frase |
| --- | --- | --- |
| **S** | SRP | Una clase, un trabajo. |
| **O** | OCP | Abierto a extensión, cerrado a modificación. |
| **L** | LSP | Sustituyes la implementación y el caller no se rompe. |
| **I** | ISP | Interfaces chicas: el cliente no arrastra métodos que no usa. |
| **D** | DIP | Dependes de una interfaz, no de Culqi / Prisma. |

| # | Letra | Ejemplo |
| --- | --- | --- |
| 1 | **S** | Controller de pedidos vs service |
| 2 | **S** | Página del carrito vs `CartView` |
| 3 | **O** | Factory de pasarelas |
| 4 | **O** | Listeners cuando cambia el pedido |
| 5 | **L** | Culqi ↔ Mercado Pago |
| 6 | **L** | Cloudinary ↔ otra nube de imágenes |
| 7 | **I** | Puertos de un solo método |
| 8 | **I** | Un repositorio por módulo |
| 9 | **D** | Cobrar sin conocer Culqi |
| 10 | **D** | Login sin conocer Prisma |

---

## 1. Controller de pedidos — **S**

**Para qué sirve.** Recibe HTTP y responde JSON. No calcula stock ni crea filas.

### Mal (inventado)

El controller hace HTTP, Prisma y reglas en un solo sitio.

```ts
@Post('checkout')
async checkout(user) {
  const cart = await prisma.cart.findFirst({ where: { userId: user.id } });
  if (!cart.items.length) throw new BadRequestException('Vacío');
  return prisma.order.create({ data: { userId: user.id, total: 99 } });
}
```

### Bien (el proyecto)

El controller enruta; `OrderService` aplica la regla.

```ts
// backend/src/pedidos/presentation/pedidos.controller.ts
@Post('checkout')
checkout(user) {
  return this.orders.checkout(user.id);
}
```

**S:** el controller cambia si cambia la ruta. El service cambia si cambia la regla.

---

## 2. Página del carrito — **S**

**Para qué sirve.** `/carrito` arma la pantalla. `CartView` carga y edita la bolsa.

### Mal (inventado)

Fetch, botones y layout en la misma página.

```tsx
export default async function CartPage() {
  const cart = await fetch('/api/carrito').then((r) => r.json());
  return cart.items.map((i) => <button>Quitar</button>);
}
```

### Bien (el proyecto)

La página es el marco; la lógica vive en el componente hijo.

```tsx
// storefront/src/app/carrito/page.tsx
export default function CartPage() {
  return (
    <>
      <h1>Bolsa</h1>
      <CartView />
    </>
  );
}
```

Lo mismo en `/checkout` (`CheckoutView`), `/pedidos` (`OrdersView`) y `/login` (`LoginForm`).

**S:** si cambia el layout, no tocas el fetch. Si cambia el fetch, no tocas la página.

---

## 3. Factory de pasarelas — **O**

**Para qué sirve.** Hoy Culqi y Mercado Pago. Una pasarela nueva no reescribe el cobro.

### Mal (inventado)

Cada proveedor nuevo abre `PaymentService` y le mete otro `if`.

```ts
async charge(order, token) {
  if (provider === 'culqi') { /* HTTP Culqi */ }
  else if (provider === 'mercadopago') { /* HTTP MP */ }
  else if (provider === 'stripe') { /* otra vez aquí */ }
}
```

### Bien (el proyecto)

El factory elige la pasarela. `PaymentService` solo llama `gateway.charge(...)`.

```ts
// backend/src/pagos/pagos.module.ts
useFactory: (config, http, payers) => {
  const provider = config.get('PAYMENT_PROVIDER') ?? 'culqi';
  if (provider === 'mercadopago') return new MercadoPagoPaymentService(...);
  return new CulqiPaymentService(...);
  // Stripe = clase nueva + una rama aquí. payment.service.ts no se toca.
},
```

**O:** abierto a nuevas pasarelas; cerrado el caso de uso de cobro.

---

## 4. Listeners cuando cambia el pedido — **O**

**Para qué sirve.** Al cambiar el estado, el admin recibe el evento por Socket.IO. Email o métricas se suman sin abrir `OrderService`.

### Mal (inventado)

`changeStatus` conoce todos los canales.

```ts
async changeStatus(id, status) {
  await this.orders.updateStatus(id, status);
  await this.socket.emitToAdmins(...);
  await this.email.send(...); // cada canal nuevo edita aquí
}
```

### Bien (el proyecto)

`OrderService` emite. Quien escuche se suscribe con `@OnEvent`.

```ts
// order.service.ts
this.events.emit('order.status.changed', payload);

// order.gateway.ts
@OnEvent('order.status.changed')
broadcastStatusChanged(payload) {
  this.server.to('admins').emit('order.status.changed', payload);
}
```

Las transiciones válidas viven en `ORDER_TRANSITIONS` (`order-status.ts`), no en `if` dentro del service.

**O:** extiendes listeners o transiciones; `changeStatus` no se reescribe.

---

## 5. Culqi y Mercado Pago son intercambiables — **L**

**Para qué sirve.** Las dos clases cumplen el mismo contrato. El cobro no pregunta “¿eres Culqi?”.

### Mal (inventado)

El caller trata distinto a cada pasarela.

```ts
if (gateway instanceof CulqiPaymentService) {
  await gateway.chargeCulqi(...);
} else {
  await gateway.chargeMercadoPago(...);
}
```

### Bien (el proyecto)

Misma firma, mismo resultado. Cualquiera va detrás de `PAYMENT_GATEWAY`.

```ts
interface IPaymentGateway {
  charge(amount, token, orderId);
}

class CulqiPaymentService implements IPaymentGateway { /* charge() */ }
class MercadoPagoPaymentService implements IPaymentGateway { /* charge() */ }

// PaymentService solo mira result.succeeded
```

**L:** sustituyes Culqi por Mercado Pago y el caso de uso sigue válido.

---

## 6. Cloudinary se puede sustituir — **L**

**Para qué sirve.** Subir la foto del producto. El catálogo pide una URL; no sabe que detrás está Cloudinary.

### Mal (inventado)

El service llama directo a Cloudinary.

```ts
async addImage(id, file) {
  const url = await cloudinary.uploader.upload(file);
}
```

### Bien (el proyecto)

`CloudinaryService` implementa `IImageStorage`. Otra nube haría lo mismo.

```ts
interface IImageStorage {
  upload(file); // → url
}

class CloudinaryService implements IImageStorage { /* upload() */ }

// ProductService
this.images.upload(file);
```

**L:** la implementación se sustituye; el caller sigue llamando `upload` y recibe una URL.

---

## 7. Contratos de un solo método — **I**

**Para qué sirve.** Cobrar no arrastra “subir imagen”. Subir imagen no arrastra “abrir transacción”.

### Mal (inventado)

Una interfaz gorda. Quien solo sube una foto depende de `charge` y `refund`.

```ts
interface IInfra {
  charge(...);
  refund(...);
  upload(...);
  runTransaction(...);
}
```

### Bien (el proyecto)

Tres puertos, cada uno con un método:

```ts
interface IPaymentGateway { charge(amount, token, orderId); }
interface IImageStorage { upload(file); }
interface ITransactionManager { run(work); }
```

`PaymentService` inyecta `IPaymentGateway`. `ProductService` inyecta `IImageStorage`. Ninguno ve los métodos del otro.

**I:** el cliente depende solo de lo que usa.

---

## 8. Un repositorio por módulo — **I**

**Para qué sirve.** Pedidos no necesita `upsertItem` del carrito. Carrito no necesita `updateStatus` del pedido.

### Mal (inventado)

Un solo repo con todo.

```ts
interface IRepository {
  findUser(...);
  upsertCartItem(...);
  createOrder(...);
  updateOrderStatus(...);
}
```

### Bien (el proyecto)

Interfaces por módulo:

```ts
// carrito
interface ICartRepository {
  findByUserId(userId);
  upsertItem(cartId, productId, quantity);
  removeItem(cartId, productId);
  clear(cartId);
}

// pedidos
interface IOrderRepository {
  findById(id);
  findByUserId(userId);
  create(data);
  updateStatus(id, status);
}
```

**I:** cada módulo ve su contrato, no la base de datos entera.

---

## 9. Cobrar sin conocer Culqi — **D**

**Para qué sirve.** El cliente paga un pedido `PENDIENTE`. Culqi o Mercado Pago cobran según `.env`.

### Mal (inventado)

El cobro habla directo con Culqi.

```ts
async charge(order, token) {
  const res = await fetch('https://api.culqi.com/v2/charges', {
    method: 'POST',
    headers: { Authorization: 'Bearer sk_test_...' },
    body: JSON.stringify({ amount: order.total, source_id: token }),
  });
  return res.json();
}
```

### Bien (el proyecto)

`PaymentService` no importa Culqi. Llama a `IPaymentGateway`.

```ts
// backend/src/pagos/application/services/payment.service.ts
constructor(gateway) { this.gateway = gateway; }

async charge(order, token) {
  const result = await this.gateway.charge(order.total, token, order.id);
  if (!result.succeeded) throw new BadRequestException('Pago rechazado');
}
```

**D:** el caso de uso depende del contrato, no de la URL ni de la API key.

---

## 10. Login sin conocer Prisma — **D**

**Para qué sirve.** Registrar y entrar. Auth busca el email y guarda el usuario. No escribe SQL.

### Mal (inventado)

Auth usa Prisma. No puedes testear el login sin base de datos.

```ts
async login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedException();
}
```

### Bien (el proyecto)

Auth pide usuarios a `IUserRepository`. PostgreSQL está en `PrismaUserRepository`.

```ts
interface IUserRepository {
  findByEmail(email);
  findById(id);
  create(data);
}

// auth.service.ts
constructor(users) { this.users = users; } // IUserRepository, no Prisma
```

**D:** el login depende de la interfaz. El repo se puede mockear en tests.

---

## Cómo contarlo (2 minutos por ejemplo)

1. “Esto sirve para …”
2. “Si no hubiera esta letra, quedaría así” → **Mal**.
3. “En Atelier ya está así” → **Bien**.
4. Nombrar la letra: **S, O, L, I o D**.
