import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NOTIFIER } from './domain/interfaces/notifier.interface.js';
import { NotificationService } from './application/services/notification.service.js';
import { WhatsAppBaileysNotifier } from './infrastructure/whatsapp-baileys.notifier.js';

@Module({
  imports: [AuthModule],
  providers: [
    NotificationService,
    {
      provide: NOTIFIER,
      useClass: WhatsAppBaileysNotifier,
    },
  ],
  exports: [NotificationService, NOTIFIER],
})
export class NotificacionesModule {}
