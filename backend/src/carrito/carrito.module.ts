import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { CART_REPOSITORY } from './domain/interfaces/cart-repository.interface.js';
import { CartService } from './application/services/cart.service.js';
import { PrismaCartRepository } from './infrastructure/repositories/prisma-cart.repository.js';
import { CarritoController } from './presentation/carrito.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    CatalogoModule,
  ],
  controllers: [CarritoController],
  providers: [
    CartService,
    {
      provide: CART_REPOSITORY,
      useClass: PrismaCartRepository,
    },
  ],
  exports: [CART_REPOSITORY, CartService],
})
export class CarritoModule {}
