import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  ORDER_STATUS_CHANGED,
  type OrderStatusChangedEvent,
} from '../domain/events/order-status-changed.event.js';

type JwtHandshakePayload = {
  sub: string;
  email: string;
  role: string;
};

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrderGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    const token = this.readToken(client);
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtHandshakePayload>(token);
      if (payload.role !== 'admin') {
        client.disconnect();
        return;
      }
      void client.join('admins');
      this.logger.log(`Admin conectado al tiempo real: ${payload.email}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Socket desconectado: ${client.id}`);
  }

  @OnEvent(ORDER_STATUS_CHANGED)
  broadcastStatusChanged(payload: OrderStatusChangedEvent): void {
    this.server.to('admins').emit(ORDER_STATUS_CHANGED, payload);
  }

  private readToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return fromAuth;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }

    const fromQuery = client.handshake.query.token;
    if (typeof fromQuery === 'string' && fromQuery.length > 0) {
      return fromQuery;
    }

    return null;
  }
}
