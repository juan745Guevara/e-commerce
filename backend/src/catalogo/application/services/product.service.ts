import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CATEGORY_REPOSITORY } from '../../domain/interfaces/category-repository.interface.js';
import type { IImageStorage } from '../../domain/interfaces/image-storage.interface.js';
import { IMAGE_STORAGE } from '../../domain/interfaces/image-storage.interface.js';
import type { IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { PRODUCT_REPOSITORY } from '../../domain/interfaces/product-repository.interface.js';
import { Product } from '../../domain/entities/product.entity.js';
import { CreateProductDto } from '../dto/create-product.dto.js';
import { QueryProductsDto } from '../dto/query-products.dto.js';
import { UpdateProductDto } from '../dto/update-product.dto.js';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: ICategoryRepository,
    @Inject(IMAGE_STORAGE)
    private readonly images: IImageStorage,
  ) {}

  findAll(query: QueryProductsDto): Promise<Product[]> {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice no puede ser mayor que maxPrice');
    }

    return this.products.findAll({
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      search: query.search?.trim() || undefined,
    });
  }

  async findById(id: string): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    this.assertNonNegativeStock(dto.stock);
    await this.assertCategoryExists(dto.categoryId);

    return this.products.create({
      name: dto.name.trim(),
      description: dto.description.trim(),
      price: dto.price,
      stock: dto.stock,
      categoryId: dto.categoryId,
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findById(id);

    if (dto.stock !== undefined) {
      this.assertNonNegativeStock(dto.stock);
    }
    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    return this.products.update(id, {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      price: dto.price,
      stock: dto.stock,
      categoryId: dto.categoryId,
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.products.delete(id);
  }

  async updateStock(id: string, stock: number): Promise<Product> {
    this.assertNonNegativeStock(stock);
    await this.findById(id);
    return this.products.updateStock(id, stock);
  }

  async addImage(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ): Promise<Product> {
    const product = await this.findById(id);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes enviar un archivo de imagen');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    const url = await this.images.upload(file);
    return this.products.update(id, {
      images: [...product.images, url],
    });
  }

  private assertNonNegativeStock(stock: number): void {
    if (stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categories.findById(categoryId);
    if (!category) {
      throw new BadRequestException('La categoría no existe');
    }
  }
}
