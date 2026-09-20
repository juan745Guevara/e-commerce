import { AxiosError } from 'axios';
import { PaymentResult } from '../domain/entities/payment-result.entity.js';

export function toFailedResult(error: unknown): PaymentResult {
  if (error instanceof AxiosError) {
    return new PaymentResult(
      'failed',
      null,
      error.response?.data ?? error.message,
    );
  }

  throw error;
}
