import { OrderItem } from './order-item.entity.js';
import type { OrderStatus } from './order-status.js';

export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly status: OrderStatus,
    public readonly items: OrderItem[],
    public readonly total: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
