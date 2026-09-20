import type { OrderStatus, OrderStatusChangedEvent } from './types';

export const ORDER_STATUS_CHANGED = 'order.status.changed';

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENVIADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export type { OrderStatusChangedEvent };
