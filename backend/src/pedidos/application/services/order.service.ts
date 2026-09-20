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
import { Order } from '../../domain/entities/order.entity.js';
import {
  canTransition,
  type OrderStatus,
} from '../../domain/entities/order-status.js';
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
    private readonly events: EventEmitter2,
  ) {}

  async checkout(userId: string): Promise<Order> {
    const cart = await this.carts.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const items = [];
    for (const item of cart.items) {
      const product = await this.products.findById(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${item.productId}`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}`,
        );
      }
      items.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        currentStock: product.stock,
      });
    }

    const total = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await this.orders.create({
      userId,
      total,
      items: items.map(({ currentStock: _stock, ...line }) => line),
    });

    try {
      for (const item of items) {
        await this.products.updateStock(
          item.productId,
          item.currentStock - item.quantity,
        );
      }
      await this.carts.clear(cart.id);
    } catch (error) {
      await this.orders.updateStatus(order.id, 'CANCELADO');
      throw error;
    }

    return order;
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

    const updated = await this.orders.updateStatus(id, nextStatus);

    if (order.status === 'PENDIENTE' && nextStatus === 'CANCELADO') {
      for (const item of order.items) {
        const product = await this.products.findById(item.productId);
        if (!product) {
          continue;
        }
        await this.products.updateStock(
          product.id,
          product.stock + item.quantity,
        );
      }
    }

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
