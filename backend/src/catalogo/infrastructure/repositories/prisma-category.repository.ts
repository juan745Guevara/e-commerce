import { Injectable } from '@nestjs/common';
import { Category as PrismaCategory } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { Category } from '../../domain/entities/category.entity.js';
import type {
  CreateCategoryData,
  ICategoryRepository,
} from '../../domain/interfaces/category-repository.interface.js';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const row = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaCategory): Category {
    return new Category(row.id, row.name, row.slug, row.createdAt);
  }
}
