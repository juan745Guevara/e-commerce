import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PaymentResult } from '../domain/entities/payment-result.entity.js';
import type { IPaymentGateway } from '../domain/interfaces/payment-gateway.interface.js';
import { toFailedResult } from './http-payment.error.js';
import { OrderPayerLookup } from './order-payer.lookup.js';

type CulqiChargeResponse = {
  id?: string;
};

@Injectable()
export class CulqiPaymentService implements IPaymentGateway {
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
    const secret = this.config.get<string>('CULQI_SECRET_KEY');
    if (!secret) {
      throw new ServiceUnavailableException('Culqi no está configurado');
    }

    const email = await this.payers.emailForOrder(orderId);
    const currency = this.config.get<string>('PAYMENT_CURRENCY') ?? 'PEN';

    try {
      const response = await firstValueFrom(
        this.http.post<CulqiChargeResponse>(
          'https://api.culqi.com/v2/charges',
          {
            amount: Math.round(amount * 100),
            currency_code: currency,
            email,
            source_id: token,
            description: `Pedido ${orderId}`.slice(0, 80),
            metadata: { orderId },
          },
          {
            headers: {
              Authorization: `Bearer ${secret}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return new PaymentResult(
        'succeeded',
        response.data.id ?? null,
        response.data,
      );
    } catch (error) {
      return toFailedResult(error);
    }
  }
}
