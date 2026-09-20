import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module.js';
import { CarritoModule } from '../carrito/carrito.module.js';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { ORDER_REPOSITORY } from './domain/interfaces/order-repository.interface.js';
import { OrderService } from './application/services/order.service.js';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository.js';
import { PedidosController } from './presentation/pedidos.controller.js';
import { OrderGateway } from './presentation/order.gateway.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    CatalogoModule,
    CarritoModule,
  ],
  controllers: [PedidosController],
  providers: [
    OrderService,
    OrderGateway,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [ORDER_REPOSITORY, OrderService],
})
export class PedidosModule {}
