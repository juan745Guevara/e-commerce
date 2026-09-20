import { Global, Module } from '@nestjs/common';
import { TRANSACTION_MANAGER } from '../../domain/interfaces/transaction-manager.interface.js';
import { PrismaTransactionManager } from './prisma-transaction-manager.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: TRANSACTION_MANAGER,
      useClass: PrismaTransactionManager,
    },
  ],
  exports: [PrismaService, TRANSACTION_MANAGER],
})
export class PrismaModule {}
