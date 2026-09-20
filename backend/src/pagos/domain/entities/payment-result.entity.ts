export type PaymentStatus = 'succeeded' | 'failed';

export class PaymentResult {
  constructor(
    public readonly status: PaymentStatus,
    public readonly transactionId: string | null,
    public readonly raw: unknown,
  ) {}

  get succeeded(): boolean {
    return this.status === 'succeeded';
  }
}
