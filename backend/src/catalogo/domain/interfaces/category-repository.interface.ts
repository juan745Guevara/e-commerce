import { Category } from '../entities/category.entity.js';

export const CATEGORY_REPOSITORY = 'ICategoryRepository';

export type CreateCategoryData = {
  name: string;
  slug: string;
};

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  create(data: CreateCategoryData): Promise<Category>;
}
