# Propuesta SOLID — Atelier

Diez ejemplos, **dos por letra**. En cada uno:

- **Mal** = cómo se vería si no usáramos esa letra (inventado).
- **Bien** = lo que **ya tiene el proyecto**.

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

El controller hace HTTP, Prisma y reglas. Una clase, muchos trabajos.

```ts
@Controller('pedidos')
class PedidosController {
  @Post('checkout')
  async checkout(@CurrentUser() user) {
    const cart = await prisma.cart.findFirst({ where: { userId: user.id } });
    if (!cart.items.length) throw new BadRequestException('Vacío');
    return prisma.order.create({ data: { userId: user.id, total: 99 } });
  }
}
```

### Bien (el proyecto)

El controller solo enruta. El service aplica la regla.

```ts
// backend/src/pedidos/presentation/pedidos.controller.ts
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly orders: OrderService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.checkout(user.id); // negocio vive en OrderService
  }
}
```

**S:** el controller cambia si cambia la ruta. El service cambia si cambia la regla.

---

## 2. Página del carrito — **S**

**Para qué sirve.** `/carrito` arma la pantalla. Otro componente carga y edita la bolsa.

### Mal (inventado)

La página hace fetch, 401, HTML y layout. Todo en un archivo.

```tsx
export default async function CartPage() {
  const res = await fetch('http://localhost:3000/carrito');
  const cart = await res.json();
  return cart.items.map((i) => <button>Quitar</button>);
}
```

### Bien (el proyecto)

La página es el marco. `CartView` pide el carrito, quita ítems y maneja el 401.

```tsx
// storefront/src/app/carrito/page.tsx
export default function CartPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14">
      <h1 className="text-headline text-[2rem]">Bolsa</h1>
      <CartView />
    </div>
  );
}
```

Lo mismo en `/checkout` (`CheckoutView`), `/pedidos` (`OrdersView`) y `/login` (`LoginForm`).

**S:** si cambia el layout, no tocas el fetch. Si cambia el fetch, no tocas la página.

---

## 3. Factory de pasarelas — **O**

**Para qué sirve.** Hoy hay Culqi y Mercado Pago. Una pasarela nueva no reescribe el cobro.

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

`PaymentService` solo llama `gateway.charge(...)`. Quién es el gateway lo decide el factory.

```ts
// backend/src/pagos/pagos.module.ts
useFactory: (config, http, payers): IPaymentGateway => {
  const provider = (config.get('PAYMENT_PROVIDER') ?? 'culqi').toLowerCase();
  if (provider === 'mercadopago') {
    return new MercadoPagoPaymentService(http, config, payers);
  }
  return new CulqiPaymentService(http, config, payers);
  // Stripe = clase nueva + una rama aquí. payment.service.ts no se toca.
},
```

**O:** abierto a nuevas pasarelas; cerrado el caso de uso de cobro.

---

## 4. Listeners cuando cambia el pedido — **O**

**Para qué sirve.** Al cambiar el estado, el admin recibe el evento por Socket.IO. Email o métricas se suman sin abrir `OrderService`.

### Mal (inventado)

`changeStatus` conoce todos los canales. Cada canal nuevo edita el service.

```ts
async changeStatus(id, status) {
  await this.orders.updateStatus(id, status);
  await this.socket.emitToAdmins(...);
  await this.email.send(...); // otra vez aquí
}
```

### Bien (el proyecto)

`OrderService` solo emite. Quien escuche se suscribe con `@OnEvent`.

```ts
// backend/src/pedidos/application/services/order.service.ts
this.events.emit(ORDER_STATUS_CHANGED, payload);

// backend/src/pedidos/presentation/order.gateway.ts
@OnEvent(ORDER_STATUS_CHANGED)
broadcastStatusChanged(payload: OrderStatusChangedEvent): void {
  this.server.to('admins').emit(ORDER_STATUS_CHANGED, payload);
}
```

Las transiciones válidas también se extienden en un solo mapa (`ORDER_TRANSITIONS` en `order-status.ts`), no con `if` nuevos dentro del service.

**O:** extiendes listeners o transiciones; el flujo de `changeStatus` no se reescribe.

---

## 5. Culqi y Mercado Pago son intercambiables — **L**

**Para qué sirve.** Las dos clases cumplen el mismo contrato. Nest inyecta una u otra; el cobro no pregunta “¿eres Culqi?”.

### Mal (inventado)

El caller hace `instanceof` y trata distinto a cada pasarela. Sustituir una por otra rompe el código.

```ts
if (gateway instanceof CulqiPaymentService) {
  await gateway.chargeCulqi(...);
} else {
  await gateway.chargeMercadoPago(...);
}
```

### Bien (el proyecto)

Misma firma, mismo `PaymentResult`. Cualquiera puede reemplazar a la otra detrás de `PAYMENT_GATEWAY`.

```ts
// backend/src/pagos/domain/interfaces/payment-gateway.interface.ts
export interface IPaymentGateway {
  charge(amount: number, token: string, orderId: string): Promise<PaymentResult>;
}

export class CulqiPaymentService implements IPaymentGateway { /* charge() */ }
export class MercadoPagoPaymentService implements IPaymentGateway { /* charge() */ }
```

El caller solo mira `result.succeeded`. No distingue la clase concreta.

**L:** sustituyes Culqi por Mercado Pago y el caso de uso sigue válido.

---

## 6. Cloudinary se puede sustituir — **L**

**Para qué sirve.** Subir la foto del producto. El catálogo pide una URL; no sabe que detrás está Cloudinary.

### Mal (inventado)

El service llama a la API de Cloudinary. Cambiar de nube obliga a reescribir el caso de uso, porque la firma y el resultado no son los mismos.

```ts
class ProductService {
  async addImage(id, file) {
    const url = await cloudinary.uploader.upload(file); // atado a un proveedor
  }
}
```

### Bien (el proyecto)

`CloudinaryService` implementa `IImageStorage.upload` y devuelve un `string` (la URL). Otra nube haría lo mismo: misma firma, mismo tipo de retorno.

```ts
// backend/src/catalogo/domain/interfaces/image-storage.interface.ts
export interface IImageStorage {
  upload(file: ImageUpload): Promise<string>;
}

// backend/src/catalogo/infrastructure/cloudinary/cloudinary.service.ts
export class CloudinaryService implements IImageStorage {
  async upload(file: ImageUpload): Promise<string> {
    // sube y resuelve result.secure_url
  }
}
```

`ProductService` solo hace `this.images.upload(file)`. Un `S3ImageStorage` con el mismo `upload(): Promise<string>` lo reemplaza sin tocar el catálogo.

**L:** la implementación se sustituye; el caller sigue llamando `upload` y recibe una URL.

---

## 7. Contratos de un solo método — **I**

**Para qué sirve.** Cobrar no arrastra “subir imagen”. Subir imagen no arrastra “abrir transacción”.

### Mal (inventado)

Una interfaz gorda. Quien solo quiere subir una foto depende de `charge`, `refund` y `sendEmail`.

```ts
interface IInfra {
  charge(...): Promise<...>;
  refund(...): Promise<...>;
  upload(...): Promise<...>;
  runTransaction(...): Promise<...>;
}
```

### Bien (el proyecto)

Tres puertos, cada uno con un método:

```ts
// pagos
export interface IPaymentGateway {
  charge(amount: number, token: string, orderId: string): Promise<PaymentResult>;
}

// catálogo
export interface IImageStorage {
  upload(file: ImageUpload): Promise<string>;
}

// shared
export interface ITransactionManager {
  run<T>(work: (tx: unknown) => Promise<T>): Promise<T>;
}
```

`PaymentService` inyecta `IPaymentGateway`. `ProductService` inyecta `IImageStorage`. Ninguno ve los métodos del otro.

**I:** el cliente depende solo de lo que usa.

---

## 8. Un repositorio por módulo — **I**

**Para qué sirve.** Pedidos no necesita `upsertItem` del carrito. Carrito no necesita `updateStatus` del pedido.

### Mal (inventado)

Un solo repo con todo. Quien pide el carrito arrastra stock, órdenes y usuarios.

```ts
interface IRepository {
  findUser(...);
  upsertCartItem(...);
  createOrder(...);
  updateOrderStatus(...);
  decrementStock(...);
}
```

### Bien (el proyecto)

Interfaces y tokens por módulo:

```ts
// backend/src/carrito/domain/interfaces/cart-repository.interface.ts
export interface ICartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  upsertItem(cartId: string, productId: string, quantity: number): Promise<Cart>;
  removeItem(cartId: string, productId: string): Promise<Cart>;
  clear(cartId: string, tx?: unknown): Promise<void>;
}

// backend/src/pedidos/domain/interfaces/order-repository.interface.ts
export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  create(data: CreateOrderData, tx?: unknown): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, tx?: unknown): Promise<Order>;
}
```

**I:** cada módulo ve su contrato, no la base de datos entera.

---

## 9. Cobrar sin conocer Culqi — **D**

**Para qué sirve.** El cliente paga un pedido `PENDIENTE`. El dinero lo cobra Culqi o Mercado Pago, según `.env`.

### Mal (inventado)

El cobro habla directo con Culqi. Cambiar de pasarela reescribe la clase.

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

### Bien (el proyecto)

`PaymentService` no importa Culqi. Llama a `IPaymentGateway`. Nest inyecta la clase concreta.

```ts
// backend/src/pagos/application/services/payment.service.ts
constructor(
  @Inject(PAYMENT_GATEWAY)
  private readonly gateway: IPaymentGateway,
) {}

const result = await this.gateway.charge(order.total, dto.token, order.id);
if (!result.succeeded) {
  throw new BadRequestException('El pago no pudo confirmarse');
}
```

**D:** el caso de uso depende del contrato, no de la URL ni de la API key.

---

## 10. Login sin conocer Prisma — **D**

**Para qué sirve.** Registrar y entrar. Auth busca el email y guarda el usuario. No escribe SQL.

### Mal (inventado)

Auth usa Prisma. No puedes testear el login sin base de datos.

```ts
class AuthService {
  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException();
  }
}
```

### Bien (el proyecto)

Auth pide usuarios a `IUserRepository`. PostgreSQL está en `PrismaUserRepository`.

```ts
// backend/src/auth/domain/interfaces/user-repository.interface.ts
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

// backend/src/auth/application/services/auth.service.ts
constructor(
  @Inject(USER_REPOSITORY)
  private readonly users: IUserRepository, // no PrismaService
) {}
```

**D:** el login depende de la interfaz. El repo se puede mockear en tests.

---

## Cómo contarlo (2 minutos por ejemplo)

1. “Esto sirve para …”
2. “Si no hubiera esta letra, quedaría así” → **Mal**.
3. “En Atelier ya está así” → **Bien**.
4. Nombrar la letra: **S, O, L, I o D**.
