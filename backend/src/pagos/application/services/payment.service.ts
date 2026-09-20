import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderService } from '../../../pedidos/application/services/order.service.js';
import type { IOrderRepository } from '../../../pedidos/domain/interfaces/order-repository.interface.js';
import { ORDER_REPOSITORY } from '../../../pedidos/domain/interfaces/order-repository.interface.js';
import type { IPaymentGateway } from '../../domain/interfaces/payment-gateway.interface.js';
import { PAYMENT_GATEWAY } from '../../domain/interfaces/payment-gateway.interface.js';
import { ChargePaymentDto } from '../dto/charge-payment.dto.js';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: IPaymentGateway,
    @Inject(ORDER_REPOSITORY)
    private readonly orders: IOrderRepository,
    private readonly orderService: OrderService,
  ) {}

  async charge(requester: { id: string; role: string }, dto: ChargePaymentDto) {
    const order = await this.orders.findById(dto.orderId);
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (requester.role !== 'admin' && order.userId !== requester.id) {
      throw new ForbiddenException('No puedes pagar este pedido');
    }
    if (order.status !== 'PENDIENTE') {
      throw new BadRequestException('El pedido no está pendiente de pago');
    }

    const result = await this.gateway.charge(
      order.total,
      dto.token,
      order.id,
    );
    if (!result.succeeded) {
      throw new BadRequestException({
        message: 'El pago no pudo confirmarse',
        payment: result,
      });
    }

    const paid = await this.orderService.changeStatus(order.id, 'PAGADO');
    return {
      order: paid,
      payment: result,
    };
  }
}
