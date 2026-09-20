import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '../../domain/entities/category.entity.js';
import type { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CATEGORY_REPOSITORY } from '../../domain/interfaces/category-repository.interface.js';
import { CreateCategoryDto } from '../dto/create-category.dto.js';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: ICategoryRepository,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categories.findAll();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const name = dto.name.trim();
    const slug = slugify(name);
    if (!slug) {
      throw new ConflictException('El nombre de la categoría no es válido');
    }

    const existing = await this.categories.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    return this.categories.create({ name, slug });
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
