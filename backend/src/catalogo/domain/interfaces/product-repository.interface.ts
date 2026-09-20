import { Product } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = 'IProductRepository';

export type ProductFilters = {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

export type CreateProductData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images?: string[];
};

export type UpdateProductData = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  images?: string[];
};

export interface IProductRepository {
  findAll(filters: ProductFilters): Promise<Product[]>;
  findById(id: string, tx?: unknown): Promise<Product | null>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  updateStock(id: string, stock: number): Promise<Product>;
  /**
   * Atomically decrements stock only if at least `quantity` units are
   * available (`stock >= quantity`). Returns `false` without changing
   * anything when there isn't enough stock, instead of racing a
   * read-then-write against concurrent checkouts.
   */
  decrementStock(id: string, quantity: number, tx?: unknown): Promise<boolean>;
  /** Atomically adds `quantity` back to stock (e.g. on order cancellation). */
  incrementStock(id: string, quantity: number, tx?: unknown): Promise<void>;
  delete(id: string): Promise<void>;
}
