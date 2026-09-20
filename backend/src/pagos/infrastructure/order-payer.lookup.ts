import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../auth/domain/interfaces/user-repository.interface.js';
import { USER_REPOSITORY } from '../../auth/domain/interfaces/user-repository.interface.js';
import type { IOrderRepository } from '../../pedidos/domain/interfaces/order-repository.interface.js';
import { ORDER_REPOSITORY } from '../../pedidos/domain/interfaces/order-repository.interface.js';

@Injectable()
export class OrderPayerLookup {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: IOrderRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
  ) {}

  async emailForOrder(orderId: string): Promise<string> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const user = await this.users.findById(order.userId);
    if (!user) {
      throw new NotFoundException('Usuario del pedido no encontrado');
    }

    return user.email;
  }
}
