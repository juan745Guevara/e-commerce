import { Order } from '../entities/order.entity.js';
import type { OrderStatus } from '../entities/order-status.js';

export const ORDER_REPOSITORY = 'IOrderRepository';

export type CreateOrderItemData = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type CreateOrderData = {
  userId: string;
  items: CreateOrderItemData[];
  total: number;
};

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findAll(): Promise<Order[]>;
  create(data: CreateOrderData): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
