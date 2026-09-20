import { IsIn } from 'class-validator';
import { ORDER_STATUSES } from '../../domain/entities/order-status.js';
import type { OrderStatus } from '../../domain/entities/order-status.js';

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status: OrderStatus;
}
