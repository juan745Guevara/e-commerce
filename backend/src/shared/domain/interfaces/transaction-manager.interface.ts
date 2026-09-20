export const TRANSACTION_MANAGER = 'ITransactionManager';

/**
 * Abstracts "run this work atomically" so application services can compose
 * multi-repository operations without depending on Prisma directly.
 *
 * The `tx` handed to `work` is an opaque handle: application code just
 * threads it through to repository calls that accept an optional `tx`
 * parameter. Only the Prisma-backed implementation (and the Prisma
 * repositories) know its real shape.
 */
export interface ITransactionManager {
  run<T>(work: (tx: unknown) => Promise<T>): Promise<T>;
}
