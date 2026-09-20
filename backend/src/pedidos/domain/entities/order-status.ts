export const ORDER_STATUSES = [
  'PENDIENTE',
  'PAGADO',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENVIADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
