import { CartItem } from './cart-item.entity.js';

export class Cart {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: CartItem[],
    public readonly updatedAt: Date,
  ) {}

  itemByProductId(productId: string): CartItem | undefined {
    return this.items.find((item) => item.productId === productId);
  }

  total(): number {
    return this.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  }
}
