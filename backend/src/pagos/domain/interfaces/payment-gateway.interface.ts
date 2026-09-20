import { PaymentResult } from '../entities/payment-result.entity.js';

export const PAYMENT_GATEWAY = 'IPaymentGateway';

export interface IPaymentGateway {
  charge(
    amount: number,
    token: string,
    orderId: string,
  ): Promise<PaymentResult>;
}
