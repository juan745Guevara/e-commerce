# Propuesta SOLID — Atelier

Para el martes. Idea simple:

- **Mal** = cómo se vería si no usáramos SOLID (ejemplo inventado).
- **Bien** = lo que **ya tiene el proyecto**. Esa es la solución. Los comentarios dicen para qué sirve cada parte.

Regla corta:

| Criterio | En una frase |
| --- | --- |
| **SRP** | Una clase, un trabajo. |
| **DIP** | Dependes de una interfaz, no de Culqi / Prisma / WhatsApp. |
| **Alta cohesión** | Lo que va junto, vive junto. |
| **Bajo acoplamiento** | Si cambias el proveedor, el resto no se entera. |

---

## 1. Cobrar un pedido

**Para qué sirve.** El cliente paga un pedido que está `PENDIENTE`. El dinero lo cobra Culqi o Mercado Pago, según `.env`.

### Mal (inventado)

El cobro habla directo con Culqi. Si mañana usas Mercado Pago, reescribes toda la clase.

```ts
class PaymentService {
  async charge(order, token) {
    // URL, headers y body de UNA sola empresa: Culqi
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

`PaymentService` no conoce Culqi. Solo llama a `IPaymentGateway`. Culqi y Mercado Pago son dos clases que implementan esa interfaz. Se elige con `PAYMENT_PROVIDER`.

```ts
// backend/src/pagos/domain/interfaces/payment-gateway.interface.ts

// Contrato: "cualquier pasarela tiene que saber cobrar".
// No dice CÓMO (ni HTTP, ni API keys). Eso es DIP.
export const PAYMENT_GATEWAY = 'IPaymentGateway'; // token: Nest inyecta la clase concreta

export interface IPaymentGateway {
  // amount  = total del pedido
  // token   = tarjeta tokenizada que manda el cliente
  // orderId = para que la pasarela sepa qué pedido está cobrando
  charge(amount: number, token: string, orderId: string): Promise<PaymentResult>;
}
```

```ts
// backend/src/pagos/application/services/payment.service.ts

constructor(
  // Nest busca quién implementa PAYMENT_GATEWAY (Culqi o Mercado Pago)
  // y lo mete aquí. PaymentService no importa esas clases.
  @Inject(PAYMENT_GATEWAY)
  private readonly gateway: IPaymentGateway,
) {}

async charge(requester, dto) {
  // dto.token = el token de la tarjeta; dto.orderId = qué pedido pagar
  const order = await this.orders.findById(dto.orderId);

  // La pasarela cobra. Da igual si por detrás es Culqi o Mercado Pago:
  // las dos tienen .charge() porque implementan IPaymentGateway.
  const result = await this.gateway.charge(
    order.total,   // cuánto cobrar
    dto.token,     // con qué tarjeta
    order.id,      // de qué pedido
  );

  if (!result.succeeded) {
    throw new BadRequestException('El pago no pudo confirmarse');
  }
  // ...marcar el pedido como PAGADO
}
```

**SOLID:** DIP + bajo acoplamiento. El caso de uso no cambia si cambia la pasarela.

---

## 2. Avisar por WhatsApp

**Para qué sirve.** Cuando el pedido queda `PAGADO` o `ENVIADO`, se manda un mensaje al teléfono del cliente.

### Mal (inventado)

El aviso importa Baileys (WhatsApp) adentro. Si quieres email, tocas el service.

```ts
class NotificationService {
  async avisar(pedido, user) {
    const sock = makeWASocket({ auth: state }); // pegado a WhatsApp
    await sock.sendMessage(user.phone + '@s.whatsapp.net', {
      text: 'Tu pedido fue pagado',
    });
  }
}
```

### Bien (el proyecto)

El service solo dice “manda este texto a este número”. WhatsApp está atrás de `INotifier`.

```ts
// backend/src/notificaciones/domain/interfaces/notifier.interface.ts

// Contrato: "avisa a alguien". No dice si es WhatsApp, email o SMS.
export const NOTIFIER = 'INotifier';

export interface INotifier {
  sendMessage(to: string, message: string): Promise<void>;
  // to      = teléfono (o el destino que use el canal)
  // message = texto listo para enviar
}
```

```ts
// backend/src/notificaciones/application/services/notification.service.ts

constructor(
  @Inject(NOTIFIER)
  private readonly notifier: INotifier, // hoy es WhatsAppBaileysNotifier
  @Inject(USER_REPOSITORY)
  private readonly users: IUserRepository, // para buscar el teléfono del cliente
) {}

// Se dispara SOLO cuando pedidos emite "order.status.changed"
// (el service de pedidos no llama a WhatsApp: ver ejemplo 7)
@OnEvent(ORDER_STATUS_CHANGED)
async onOrderStatusChanged(event: OrderStatusChangedEvent) {
  // Solo avisamos en estos dos estados; el resto se ignora
  if (event.status !== 'PAGADO' && event.status !== 'ENVIADO') return;

  const user = await this.users.findById(event.userId);
  if (!user?.phone) return; // sin teléfono no hay a quién escribir

  // buildMessage arma el texto según el estado (pagado vs enviado)
  // sendMessage es de INotifier: no hay makeWASocket acá
  await this.notifier.sendMessage(user.phone, this.buildMessage(event));
}
```

**SOLID:** DIP. Mañana un `EmailNotifier` implementa la misma interfaz y este service no se toca.

---

## 3. Subir foto del producto

**Para qué sirve.** El admin sube una imagen del producto. Se guarda en la nube y la URL queda en el producto.

### Mal (inventado)

El catálogo habla con Cloudinary. Cambiar a S3 = reescribir `ProductService`.

```ts
class ProductService {
  async addImage(id, file) {
    const up = await cloudinary.uploader.upload_stream(file); // SDK concreto
    await prisma.product.update({
      where: { id },
      data: { images: { push: up.secure_url } },
    });
  }
}
```

### Bien (el proyecto)

`ProductService` pide “súbeme esto y dame la URL” a `IImageStorage`. Cloudinary es solo quien implementa `upload`.

```ts
// backend/src/catalogo/domain/interfaces/image-storage.interface.ts

export const IMAGE_STORAGE = 'IImageStorage';

export type ImageUpload = {
  buffer: Buffer;       // bytes del archivo
  mimetype: string;     // ej. "image/jpeg"
  originalname: string; // nombre que mandó el admin
};

export interface IImageStorage {
  // Recibe el archivo y devuelve la URL pública (https://res.cloudinary.com/...)
  upload(file: ImageUpload): Promise<string>;
}
```

```ts
// backend/src/catalogo/application/services/product.service.ts

async addImage(id: string, file: ImageUpload) {
  const product = await this.findById(id); // el producto tiene que existir

  // Validación de negocio: tiene que ser una imagen con contenido
  if (!file?.buffer?.length) {
    throw new BadRequestException('Debes enviar un archivo de imagen');
  }
  if (!file.mimetype.startsWith('image/')) {
    throw new BadRequestException('El archivo debe ser una imagen');
  }

  // this.images es IImageStorage (hoy CloudinaryService).
  // ProductService no importa cloudinary ni prisma.
  const url = await this.images.upload(file);

  // Se agrega la URL nueva a las que ya tenía el producto
  return this.products.update(id, {
    images: [...product.images, url],
  });
}
```

**SOLID:** DIP + bajo acoplamiento. El catálogo no sabe qué nube guarda la foto.

---

## 4. Checkout (carrito → pedido)

**Para qué sirve.** Al comprar: se baja el stock, se crea el pedido y se vacía el carrito. Si algo falla, no debe quedar a medias (pedido creado y stock ya descontado).

### Mal (inventado)

El service de pedidos usa Prisma a pelo. Si cambias de base de datos, se rompe el checkout.

```ts
class OrderService {
  async checkout(userId) {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { stock: { decrement: 1 } } });
      await tx.order.create({ data: { userId } });
      await tx.cartItem.deleteMany({ where: { cartId } });
    });
  }
}
```

### Bien (el proyecto)

`OrderService` no importa Prisma. Pide “corre esto junto” a `ITransactionManager` y habla con repositorios (interfaces).

```ts
// backend/src/shared/domain/interfaces/transaction-manager.interface.ts

export const TRANSACTION_MANAGER = 'ITransactionManager';

export interface ITransactionManager {
  // run = "ejecuta este trabajo de forma atómica".
  // Si algo adentro falla, se revierte TODO.
  // tx es opaco: application no sabe que es un Prisma.TransactionClient.
  run<T>(work: (tx: unknown) => Promise<T>): Promise<T>;
}
```

```ts
// backend/src/pedidos/application/services/order.service.ts

async checkout(userId: string) {
  const cart = await this.carts.findByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw new BadRequestException('El carrito está vacío');
  }

  // Todo lo de adentro va o no va: stock + pedido + vaciar carrito
  return this.transactions.run(async (tx) => {
    const items = [];

    for (const cartItem of cart.items) {
      // tx se pasa a cada repo para que usen LA MISMA transacción
      const product = await this.products.findById(cartItem.productId, tx);

      // Baja stock solo si alcanza. Si no, reserved = false y se aborta todo
      const reserved = await this.products.decrementStock(
        product.id,
        cartItem.quantity,
        tx,
      );
      if (!reserved) {
        throw new BadRequestException(`Stock insuficiente para ${product.name}`);
      }

      items.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: cartItem.quantity,
      });
    }

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const order = await this.orders.create({ userId, total, items }, tx);
    await this.carts.clear(cart.id, tx); // carrito vacío solo si el pedido salió bien
    return order;
  });
}
```

**SOLID:** DIP. Application no conoce Prisma. Infrastructure sí (`PrismaTransactionManager`).

---

## 5. Agregar al carrito

**Para qué sirve.** El cliente mete un producto a la bolsa. Hay que leer el producto (¿hay stock?) y guardar el ítem.

### Mal (inventado)

El carrito importa las clases Prisma del catálogo. Los módulos quedan pegados.

```ts
class CartService {
  constructor(
    private prismaCart: PrismaCartRepository,
    private prismaProduct: PrismaProductRepository, // clase concreta de otro módulo
  ) {}

  async addItem(userId, productId) {
    const product = await this.prismaProduct.findById(productId);
    await this.prismaCart.upsertItem(...);
  }
}
```

### Bien (el proyecto)

El carrito depende de **interfaces**. Prisma vive en `infrastructure` y se engancha con un token.

```ts
// backend/src/carrito/application/services/cart.service.ts

constructor(
  // CARrito: guardar / leer la bolsa del usuario
  @Inject(CART_REPOSITORY)
  private readonly carts: ICartRepository,

  // Catálogo: solo para leer el producto y su stock.
  // CatalogoModule EXPORTA el token PRODUCT_REPOSITORY;
  // carrito no importa PrismaProductRepository.
  @Inject(PRODUCT_REPOSITORY)
  private readonly products: IProductRepository,
) {}

async addItem(userId: string, dto: AddCartItemDto) {
  const cart = await this.getOrCreate(userId); // si no tiene bolsa, la crea

  // requireProduct = findById + error si no existe
  const product = await this.requireProduct(dto.productId);

  // Si ya tenía ese producto, se SUMA la cantidad (no se duplica la fila)
  const currentQty = cart.itemByProductId(product.id)?.quantity ?? 0;
  const nextQty = currentQty + dto.quantity;

  this.assertStock(product.stock, nextQty); // no dejar pedir más de lo que hay

  // upsertItem = "pon esta cantidad de este producto en este carrito"
  return toCartResponse(
    await this.carts.upsertItem(cart.id, product.id, nextQty),
  );
}
```

**SOLID:** DIP + bajo acoplamiento entre `carrito` y `catalogo`.

---

## 6. El controller de pedidos

**Para qué sirve.** Recibe el HTTP (`POST /pedidos/checkout`, listar, cambiar estado) y responde JSON. No calcula stock ni crea filas.

### Mal (inventado)

El controller hace de todo: HTTP + Prisma + reglas. Una clase, muchos trabajos.

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

El controller solo enruta. Pregunta “quién eres” y pasa el id al service.

```ts
// backend/src/pedidos/presentation/pedidos.controller.ts

@Controller('pedidos')           // todas las rutas empiezan con /pedidos
@UseGuards(JwtAuthGuard)        // sin JWT válido → 401. Esto es HTTP, no negocio
export class PedidosController {
  constructor(private readonly orders: OrderService) {} // la lógica vive allá

  @Post('checkout')
  checkout(@CurrentUser() user: AuthenticatedUser) {
    // @CurrentUser lee el usuario del token. El controller solo pasa el id.
    return this.orders.checkout(user.id);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.listByUser(user.id); // "mis" pedidos
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')                // extra: solo rol admin
  listAll() {
    return this.orders.listAll();
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin')
  changeStatus(
    @Param('id') id: string,                 // id de la URL
    @Body() dto: UpdateOrderStatusDto,       // { status: 'ENVIADO' } del body
  ) {
    return this.orders.changeStatus(id, dto.status);
  }
}
```

Igual en auth: `AuthController` solo llama a `authService.register(dto)` / `login(dto)`.

**SOLID:** SRP. El controller cambia si cambia la ruta. El service cambia si cambia la regla de negocio.

---

## 7. Avisar cuando cambia el estado (sin llamar a WhatsApp)

**Para qué sirve.** Al pasar un pedido a `PAGADO`, el admin lo ve en vivo (WebSocket) y el cliente recibe WhatsApp. Pedidos no tiene que conocer esos canales.

### Mal (inventado)

`OrderService` llama a WhatsApp y al socket. Cada canal nuevo = editar pedidos.

```ts
class OrderService {
  async changeStatus(id, next) {
    const order = await this.orders.updateStatus(id, next);
    await whatsapp.send(order.userId, 'Tu pedido cambió');
    io.to('admins').emit('pedido', order);
    return order;
  }
}
```

### Bien (el proyecto)

Pedidos solo **avisa** “el estado cambió”. Quien quiera reaccionar, se suscribe.

```ts
// backend/src/pedidos/domain/events/order-status-changed.event.ts

// Nombre del evento (string). Todos escuchan ESTA misma constante.
export const ORDER_STATUS_CHANGED = 'order.status.changed';

export type OrderStatusChangedEvent = {
  orderId: string;
  userId: string;
  status: OrderStatus; // PAGADO, ENVIADO, etc.
};
```

```ts
// backend/src/pedidos/application/services/order.service.ts  (al final de changeStatus)

// emit = "pasó esto". No espera respuesta. No importa quién escuche.
this.events.emit(ORDER_STATUS_CHANGED, {
  orderId: updated.id,
  userId: updated.userId,
  status: updated.status,
});
```

```ts
// backend/src/notificaciones/application/services/notification.service.ts
@OnEvent(ORDER_STATUS_CHANGED) // "cuando cambie un pedido, avísame"
async onOrderStatusChanged(event) {
  // busca teléfono y manda WhatsApp (vía INotifier)
}

// backend/src/pedidos/presentation/order.gateway.ts
@OnEvent(ORDER_STATUS_CHANGED)
onOrderStatusChanged(event) {
  // manda el cambio a la sala "admins" por Socket.IO
}
```

**SOLID:** SRP + bajo acoplamiento. Pedidos no importa WhatsApp ni el gateway.

---

## 8. Qué estados puede tener un pedido

**Para qué sirve.** Un pedido no puede saltar de `PENDIENTE` a `ENTREGADO`. Las transiciones válidas viven en un solo lugar para que backend y admin no se contradigan.

### Mal (inventado)

Los `if` están en el controller, en el admin y en el service. Uno se desactualiza y el otro no.

```ts
// en el controller
if (actual === 'PENDIENTE' && (nuevo === 'PAGADO' || nuevo === 'CANCELADO')) { ok }

// en el admin, otro if distinto
if (status === 'PAGADO') mostrarBotonEnviado();
```

### Bien (el proyecto)

El mapa de transiciones es la regla. El service solo pregunta. El admin copia el mismo mapa para los botones.

```ts
// backend/src/pedidos/domain/entities/order-status.ts

// Todos los estados posibles del pedido
export const ORDER_STATUSES = [
  'PENDIENTE',
  'PAGADO',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
] as const;

// De cada estado, a cuáles se PUEDE pasar.
// Array vacío = estado final (no hay siguiente).
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'], // o paga, o cancela
  PAGADO: ['ENVIADO'],                // el admin lo manda
  ENVIADO: ['ENTREGADO'],             // el cliente lo recibe
  ENTREGADO: [],
  CANCELADO: [],
};

// Pregunta de dominio: ¿este salto es legal?
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
```

```ts
// backend/src/pedidos/application/services/order.service.ts

async changeStatus(id: string, nextStatus: OrderStatus) {
  const order = await this.requireOrder(id);

  // El service no tiene if/else de cada par de estados:
  // le pregunta al dominio.
  if (!canTransition(order.status, nextStatus)) {
    throw new BadRequestException(
      `No se puede pasar de ${order.status} a ${nextStatus}`,
    );
  }

  // Extra: si cancela un PENDIENTE, hay que devolver el stock
  const shouldRestoreStock =
    order.status === 'PENDIENTE' && nextStatus === 'CANCELADO';

  // ...transacción + emit del evento (ejemplo 7)
}
```

```ts
// admin/src/lib/orders.ts
// El panel usa el MISMO mapa para habilitar botones
// (PENDIENTE → mostrar "Marcar pagado" y "Cancelar")
export const ORDER_TRANSITIONS = { /* igual que el backend */ };
```

**SOLID:** alta cohesión. La regla de estados vive en un archivo, no repartida en `if`.

---

## 9. Login y registro

**Para qué sirve.** Crear usuario y entrar. Hay que buscar el email y guardar el usuario. Auth no escribe SQL.

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

Auth pide usuarios a `IUserRepository`. Quien habla con PostgreSQL es `PrismaUserRepository`.

```ts
// backend/src/auth/domain/interfaces/user-repository.interface.ts

export const USER_REPOSITORY = 'IUserRepository';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>; // ¿ya existe este email?
  findById(id: string): Promise<User | null>;       // JWT → usuario (Passport)
  create(data: CreateUserData): Promise<User>;      // registro
}
```

```ts
// backend/src/auth/application/services/auth.service.ts

constructor(
  @Inject(USER_REPOSITORY)
  private readonly users: IUserRepository, // no PrismaService
) {}

async register(dto: RegisterDto) {
  const email = dto.email.toLowerCase().trim();

  // Si findByEmail encuentra a alguien → 409, no se duplica
  const existing = await this.users.findByEmail(email);
  if (existing) throw new ConflictException('El email ya está registrado');

  const passwordHash = await bcrypt.hash(dto.password, 10);

  // create guarda hash, rol "cliente" y teléfono opcional
  const user = await this.users.create({
    email,
    passwordHash,
    role: 'cliente',
    phone: dto.phone?.trim() || null,
  });

  return user.toPublic(); // sin passwordHash hacia afuera
}

async login(dto: LoginDto) {
  const user = await this.users.findByEmail(dto.email.toLowerCase().trim());
  if (!user) throw new UnauthorizedException('Credenciales inválidas');

  const matches = await bcrypt.compare(dto.password, user.passwordHash);
  if (!matches) throw new UnauthorizedException('Credenciales inválidas');

  // El JWT lleva id, email y rol (el admin panel lo usa para dejar entrar)
  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken, user: user.toPublic() };
}
```

**SOLID:** DIP. El login no depende de Prisma. El repo se puede mockear en tests.

---

## 10. La página del carrito en la tienda

**Para qué sirve.** Mostrar la bolsa al cliente. La ruta `/carrito` solo arma la pantalla; otro componente carga y edita los ítems.

### Mal (inventado)

La página hace el fetch, el 401, el HTML y el layout. Todo en un archivo.

```tsx
export default async function CartPage() {
  const res = await fetch('http://localhost:3000/carrito');
  const cart = await res.json();
  return (
    <div>
      {cart.items.map((i) => (
        <button onClick={() => fetch('/carrito/items/' + i.id, { method: 'DELETE' })}>
          Quitar
        </button>
      ))}
    </div>
  );
}
```

### Bien (el proyecto)

La página es el marco (título + padding). `CartView` es “la bolsa”: pide el carrito, quita ítems, muestra vacío.

```tsx
// storefront/src/app/carrito/page.tsx
// Archivo de RUTA de Next: /carrito
// No llama a la API. No sabe si hay ítems. Solo pinta el cascarón.

export default function CartPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14">
      <h1 className="text-headline text-[2rem]">Bolsa</h1>

      {/* CartView (client component) hace:
          - browserApi.getCart()
          - quitar / cambiar cantidad
          - "inicia sesión" si responde 401 */}
      <CartView />
    </div>
  );
}
```

Lo mismo en las otras rutas de la tienda:

| Ruta | Página (marco) | Componente (trabajo) |
| --- | --- | --- |
| `/carrito` | `CartPage` | `CartView` |
| `/checkout` | `CheckoutPage` | `CheckoutView` |
| `/pedidos` | `OrdersPage` | `OrdersView` |
| `/login` | `LoginPage` | `LoginForm` |

**SOLID:** SRP + cohesión. Si cambia el layout de `/carrito`, no tocas cómo se carga la bolsa. Si cambia el fetch, no tocas la página.

---

## Cómo contarlo el martes (2 minutos por ejemplo)

1. “Esto sirve para …”
2. “Si no hubiera SOLID, quedaría así” → bloque **Mal**.
3. “En Atelier ya está así” → bloque **Bien** (abrir el archivo y leer los comentarios).
4. “Por eso es SRP / DIP / cohesión / bajo acoplamiento.”

Los 3 más claros para el docente:

1. **Pagos** (`IPaymentGateway`) — DIP.
2. **Controller vs service** — SRP.
3. **Evento de pedido** — bajo acoplamiento.

No hace falta inventar otra arquitectura. El proyecto ya aplica SOLID en estas partes.
