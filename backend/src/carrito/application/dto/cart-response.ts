import { Cart } from '../../domain/entities/cart.entity.js';

export function toCartResponse(cart: Cart) {
  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items,
    total: cart.total(),
    updatedAt: cart.updatedAt,
  };
}
