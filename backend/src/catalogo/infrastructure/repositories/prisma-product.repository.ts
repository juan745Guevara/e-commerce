import { Injectable } from '@nestjs/common';
import { Prisma, Product as PrismaProduct } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { Product } from '../../domain/entities/product.entity.js';
import type {
  CreateProductData,
  IProductRepository,
  ProductFilters,
  UpdateProductData,
} from '../../domain/interfaces/product-repository.interface.js';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ProductFilters): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: this.toWhere(filters),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateProductData): Promise<Product> {
    const row = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        stock: data.stock,
        categoryId: data.categoryId,
        images: data.images ?? [],
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const row = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price:
          data.price === undefined ? undefined : new Prisma.Decimal(data.price),
        stock: data.stock,
        categoryId: data.categoryId,
        images: data.images,
      },
    });
    return this.toDomain(row);
  }

  async updateStock(id: string, stock: number): Promise<Product> {
    const row = await this.prisma.product.update({
      where: { id },
      data: { stock },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  private toWhere(filters: ProductFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private toDomain(row: PrismaProduct): Product {
    return new Product(
      row.id,
      row.name,
      row.description,
      Number(row.price),
      row.stock,
      row.images,
      row.categoryId,
      row.createdAt,
    );
  }
}
