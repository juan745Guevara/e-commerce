import type { OrderStatus } from '../entities/order-status.js';

export const ORDER_STATUS_CHANGED = 'order.status.changed';

export type OrderStatusChangedEvent = {
  orderId: string;
  userId: string;
  status: OrderStatus;
};
