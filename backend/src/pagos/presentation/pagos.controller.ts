import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/infrastructure/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../shared/infrastructure/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../shared/infrastructure/guards/jwt-auth.guard.js';
import { ChargePaymentDto } from '../application/dto/charge-payment.dto.js';
import { PaymentService } from '../application/services/payment.service.js';

@Controller('pagos')
@UseGuards(JwtAuthGuard)
export class PagosController {
  constructor(private readonly payments: PaymentService) {}

  @Post('charge')
  charge(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChargePaymentDto,
  ) {
    return this.payments.charge(user, dto);
  }
}
