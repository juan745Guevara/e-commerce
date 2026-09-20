import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../shared/infrastructure/guards/jwt-auth.guard.js';
import { Roles } from '../../shared/infrastructure/guards/roles.decorator.js';
import { RolesGuard } from '../../shared/infrastructure/guards/roles.guard.js';
import { CreateCategoryDto } from '../application/dto/create-category.dto.js';
import { CreateProductDto } from '../application/dto/create-product.dto.js';
import { QueryProductsDto } from '../application/dto/query-products.dto.js';
import { UpdateProductDto } from '../application/dto/update-product.dto.js';
import { CategoryService } from '../application/services/category.service.js';
import { ProductService } from '../application/services/product.service.js';

@Controller('catalogo')
export class CatalogoController {
  constructor(
    private readonly products: ProductService,
    private readonly categories: CategoryService,
  ) {}

  @Get('categorias')
  listCategories() {
    return this.categories.findAll();
  }

  @Get('categorias/:id')
  getCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.findById(id);
  }

  @Post('categorias')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Get('productos')
  listProducts(@Query() query: QueryProductsDto) {
    return this.products.findAll(query);
  }

  @Get('productos/:id')
  getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.findById(id);
  }

  @Post('productos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createProduct(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch('productos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(id, dto);
  }

  @Delete('productos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.delete(id);
  }

  @Post('productos/:id/imagenes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.products.addImage(id, file);
  }
}
