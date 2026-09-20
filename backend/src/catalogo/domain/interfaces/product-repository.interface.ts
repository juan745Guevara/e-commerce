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
  findById(id: string): Promise<Product | null>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  updateStock(id: string, stock: number): Promise<Product>;
  delete(id: string): Promise<void>;
}
