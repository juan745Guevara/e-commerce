import { Cart } from '../entities/cart.entity.js';

export const CART_REPOSITORY = 'ICartRepository';

export interface ICartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  create(userId: string): Promise<Cart>;
  upsertItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart>;
  removeItem(cartId: string, productId: string): Promise<Cart>;
  clear(cartId: string): Promise<void>;
}
