import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ICartRepository } from '../../../carrito/domain/interfaces/cart-repository.interface.js';
import { CART_REPOSITORY } from '../../../carrito/domain/interfaces/cart-repository.interface.js';
import type { IProductRepository } from '../../../catalogo/domain/interfaces/product-repository.interface.js';
import { PRODUCT_REPOSITORY } from '../../../catalogo/domain/interfaces/product-repository.interface.js';
import type { ITransactionManager } from '../../../shared/domain/interfaces/transaction-manager.interface.js';
import { TRANSACTION_MANAGER } from '../../../shared/domain/interfaces/transaction-manager.interface.js';
import { Order } from '../../domain/entities/order.entity.js';
import {
  canTransition,
  type OrderStatus,
} from '../../domain/entities/order-status.js';
import type { CreateOrderItemData } from '../../domain/interfaces/order-repository.interface.js';
import type { IOrderRepository } from '../../domain/interfaces/order-repository.interface.js';
import { ORDER_REPOSITORY } from '../../domain/interfaces/order-repository.interface.js';
import {
  ORDER_STATUS_CHANGED,
  type OrderStatusChangedEvent,
} from '../../domain/events/order-status-changed.event.js';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: IOrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly carts: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactions: ITransactionManager,
    private readonly events: EventEmitter2,
  ) {}

  async checkout(userId: string): Promise<Order> {
    const cart = await this.carts.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Todo lo de abajo corre dentro de una única transacción de base de
    // datos: si el stock de cualquier producto no alcanza, o cualquier paso
    // falla, Prisma revierte automáticamente TODO (nada de pedidos a medio
    // crear ni stock descontado de más). Esto reemplaza el patrón anterior
    // de "leer stock, validar, y recién después descontar", que dejaba una
    // ventana para que dos checkouts concurrentes vendieran el mismo stock
    // dos veces.
    return this.transactions.run(async (tx) => {
      const items: CreateOrderItemData[] = [];

      for (const cartItem of cart.items) {
        const product = await this.products.findById(cartItem.productId, tx);
        if (!product) {
          throw new NotFoundException(
            `Producto no encontrado: ${cartItem.productId}`,
          );
        }

        const reserved = await this.products.decrementStock(
          product.id,
          cartItem.quantity,
          tx,
        );
        if (!reserved) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}`,
          );
        }

        items.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: cartItem.quantity,
        });
      }

      const total = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );

      const order = await this.orders.create({ userId, total, items }, tx);
      await this.carts.clear(cart.id, tx);

      return order;
    });
  }

  listByUser(userId: string): Promise<Order[]> {
    return this.orders.findByUserId(userId);
  }

  listAll(): Promise<Order[]> {
    return this.orders.findAll();
  }

  async getById(id: string, requester: { id: string; role: string }): Promise<Order> {
    const order = await this.requireOrder(id);
    if (requester.role !== 'admin' && order.userId !== requester.id) {
      throw new ForbiddenException('No puedes ver este pedido');
    }
    return order;
  }

  async changeStatus(id: string, nextStatus: OrderStatus): Promise<Order> {
    const order = await this.requireOrder(id);
    if (!canTransition(order.status, nextStatus)) {
      throw new BadRequestException(
        `No se puede pasar de ${order.status} a ${nextStatus}`,
      );
    }

    const shouldRestoreStock =
      order.status === 'PENDIENTE' && nextStatus === 'CANCELADO';

    // El cambio de estado y la reposición de stock (si aplica) también
    // corren juntos en una transacción, por la misma razón que en
    // checkout(): evita que una cancelación quede a medio aplicar.
    const updated = await this.transactions.run(async (tx) => {
      const result = await this.orders.updateStatus(id, nextStatus, tx);

      if (shouldRestoreStock) {
        for (const item of order.items) {
          const product = await this.products.findById(item.productId, tx);
          if (!product) {
            continue;
          }
          await this.products.incrementStock(product.id, item.quantity, tx);
        }
      }

      return result;
    });

    const payload: OrderStatusChangedEvent = {
      orderId: updated.id,
      userId: updated.userId,
      status: updated.status,
    };
    this.events.emit(ORDER_STATUS_CHANGED, payload);

    return updated;
  }

  private async requireOrder(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }
}
