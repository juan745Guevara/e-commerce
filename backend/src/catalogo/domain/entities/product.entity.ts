export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly images: string[],
    public readonly categoryId: string,
    public readonly createdAt: Date,
  ) {}
}
