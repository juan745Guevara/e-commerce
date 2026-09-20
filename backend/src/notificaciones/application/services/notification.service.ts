import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { IUserRepository } from '../../../auth/domain/interfaces/user-repository.interface.js';
import { USER_REPOSITORY } from '../../../auth/domain/interfaces/user-repository.interface.js';
import {
  ORDER_STATUS_CHANGED,
  type OrderStatusChangedEvent,
} from '../../../pedidos/domain/events/order-status-changed.event.js';
import type { INotifier } from '../../domain/interfaces/notifier.interface.js';
import { NOTIFIER } from '../../domain/interfaces/notifier.interface.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(NOTIFIER)
    private readonly notifier: INotifier,
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
  ) {}

  @OnEvent(ORDER_STATUS_CHANGED)
  async onOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    if (event.status !== 'PAGADO' && event.status !== 'ENVIADO') {
      return;
    }

    const user = await this.users.findById(event.userId);
    if (!user?.phone) {
      this.logger.warn(
        `Pedido ${event.orderId}: el cliente no tiene teléfono, se omite WhatsApp`,
      );
      return;
    }

    try {
      await this.notifier.sendMessage(user.phone, this.buildMessage(event));
    } catch (error) {
      this.logger.error(
        `No se pudo notificar el pedido ${event.orderId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private buildMessage(event: OrderStatusChangedEvent): string {
    if (event.status === 'PAGADO') {
      return `Tu pedido ${event.orderId} fue pagado y lo estamos preparando.`;
    }
    return `Tu pedido ${event.orderId} fue enviado.`;
  }
}
