import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module.js';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { CarritoModule } from './carrito/carrito.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { NotificacionesModule } from './notificaciones/notificaciones.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    CatalogoModule,
    CarritoModule,
    PedidosModule,
    PagosModule,
    NotificacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
