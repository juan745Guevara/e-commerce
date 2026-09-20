import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PaymentResult } from '../domain/entities/payment-result.entity.js';
import type { IPaymentGateway } from '../domain/interfaces/payment-gateway.interface.js';
import { toFailedResult } from './http-payment.error.js';
import { OrderPayerLookup } from './order-payer.lookup.js';

type MercadoPagoPaymentResponse = {
  id?: number | string;
  status?: string;
};

@Injectable()
export class MercadoPagoPaymentService implements IPaymentGateway {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly payers: OrderPayerLookup,
  ) {}

  async charge(
    amount: number,
    token: string,
    orderId: string,
  ): Promise<PaymentResult> {
    const accessToken = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new ServiceUnavailableException(
        'MercadoPago no está configurado',
      );
    }

    const email = await this.payers.emailForOrder(orderId);

    try {
      const response = await firstValueFrom(
        this.http.post<MercadoPagoPaymentResponse>(
          'https://api.mercadopago.com/v1/payments',
          {
            transaction_amount: amount,
            token,
            description: `Pedido ${orderId}`,
            installments: 1,
            payer: { email },
            metadata: { orderId },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-Idempotency-Key': orderId,
            },
          },
        ),
      );

      const approved = response.data.status === 'approved';
      return new PaymentResult(
        approved ? 'succeeded' : 'failed',
        response.data.id != null ? String(response.data.id) : null,
        response.data,
      );
    } catch (error) {
      return toFailedResult(error);
    }
  }
}
