import { io, type Socket } from 'socket.io-client';
import { apiBaseUrl } from './config';
import { ORDER_STATUS_CHANGED } from './orders';
import type { OrderStatusChangedEvent } from './types';

export function connectAdminSocket(
  token: string,
  onStatusChanged: (payload: OrderStatusChangedEvent) => void,
): Socket {
  const socket = io(apiBaseUrl(), {
    auth: { token },
  });
  socket.on(ORDER_STATUS_CHANGED, onStatusChanged);
  return socket;
}
