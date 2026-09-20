import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CATEGORY_REPOSITORY } from './domain/interfaces/category-repository.interface.js';
import { IMAGE_STORAGE } from './domain/interfaces/image-storage.interface.js';
import { PRODUCT_REPOSITORY } from './domain/interfaces/product-repository.interface.js';
import { CategoryService } from './application/services/category.service.js';
import { ProductService } from './application/services/product.service.js';
import { CloudinaryService } from './infrastructure/cloudinary/cloudinary.service.js';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository.js';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository.js';
import { CatalogoController } from './presentation/catalogo.controller.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [CatalogoController],
  providers: [
    ProductService,
    CategoryService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: CATEGORY_REPOSITORY,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: IMAGE_STORAGE,
      useClass: CloudinaryService,
    },
  ],
  exports: [PRODUCT_REPOSITORY, ProductService],
})
export class CatalogoModule {}
