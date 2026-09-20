import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module.js';
import { PedidosModule } from '../pedidos/pedidos.module.js';
import type { IPaymentGateway } from './domain/interfaces/payment-gateway.interface.js';
import { PAYMENT_GATEWAY } from './domain/interfaces/payment-gateway.interface.js';
import { PaymentService } from './application/services/payment.service.js';
import { CulqiPaymentService } from './infrastructure/culqi-payment.service.js';
import { MercadoPagoPaymentService } from './infrastructure/mercadopago-payment.service.js';
import { OrderPayerLookup } from './infrastructure/order-payer.lookup.js';
import { PagosController } from './presentation/pagos.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule.register({ timeout: 15000 }),
    AuthModule,
    PedidosModule,
  ],
  controllers: [PagosController],
  providers: [
    PaymentService,
    OrderPayerLookup,
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService, HttpService, OrderPayerLookup],
      useFactory: (
        config: ConfigService,
        http: HttpService,
        payers: OrderPayerLookup,
      ): IPaymentGateway => {
        const provider = (
          config.get<string>('PAYMENT_PROVIDER') ?? 'culqi'
        ).toLowerCase();

        if (provider === 'mercadopago') {
          return new MercadoPagoPaymentService(http, config, payers);
        }

        return new CulqiPaymentService(http, config, payers);
      },
    },
  ],
  exports: [PaymentService, PAYMENT_GATEWAY],
})
export class PagosModule {}
