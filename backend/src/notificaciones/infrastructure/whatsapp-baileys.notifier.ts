import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import type { INotifier } from '../domain/interfaces/notifier.interface.js';

@Injectable()
export class WhatsAppBaileysNotifier
  implements INotifier, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WhatsAppBaileysNotifier.name);
  private socket: WASocket | null = null;
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    void this.connect();
  }

  onModuleDestroy(): void {
    this.ready = false;
    this.socket = null;
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.socket || !this.ready) {
      throw new ServiceUnavailableException(
        'WhatsApp no está conectado. Escanea el QR en la consola del servidor.',
      );
    }

    const jid = toWhatsAppJid(to);
    await this.socket.sendMessage(jid, { text: message });
  }

  private async connect(): Promise<void> {
    const sessionPath =
      this.config.get<string>('WHATSAPP_SESSION_PATH') ?? '.wa-auth';

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const socket = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
      });

      this.socket = socket;
      socket.ev.on('creds.update', saveCreds);
      socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
          this.logger.warn(
            'Escanea este QR con WhatsApp para activar las notificaciones:',
          );
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
          this.ready = true;
          this.logger.log('WhatsApp conectado');
        }

        if (connection === 'close') {
          this.ready = false;
          const statusCode = (lastDisconnect?.error as Boom | undefined)
            ?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;
          if (loggedOut) {
            this.logger.error(
              'Sesión de WhatsApp cerrada. Borra .wa-auth y vuelve a escanear el QR.',
            );
            return;
          }
          this.logger.warn('WhatsApp desconectado. Reintentando...');
          void this.connect();
        }
      });
    } catch (error) {
      this.logger.error(
        'No se pudo iniciar Baileys. La API seguirá funcionando sin WhatsApp.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

function toWhatsAppJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}
