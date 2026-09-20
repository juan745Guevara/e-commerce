export class CartItem {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly productName: string,
    public readonly unitPrice: number,
    public readonly stock: number,
    public readonly image: string | null,
  ) {}
}
