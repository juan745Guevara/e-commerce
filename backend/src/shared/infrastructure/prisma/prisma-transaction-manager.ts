import { Injectable } from '@nestjs/common';
import type { ITransactionManager } from '../../domain/interfaces/transaction-manager.interface.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class PrismaTransactionManager implements ITransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: (tx: unknown) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(tx));
  }
}
