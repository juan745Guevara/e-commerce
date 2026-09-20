import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../lib/api';
import { formatMoney } from '../lib/money';
import { ORDER_TRANSITIONS } from '../lib/orders';
import { connectAdminSocket } from '../lib/socket';
import { getStoredToken } from '../lib/session';
import type { Order, OrderStatus, OrderStatusChangedEvent } from '../lib/types';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOrders(await api.listAdminOrders());
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    });
  }, [load]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || user?.role !== 'admin') {
      return;
    }

    const socket = connectAdminSocket(
      token,
      (payload: OrderStatusChangedEvent) => {
        setFlash(
          `Pedido ${payload.orderId.slice(0, 8)}… ahora está ${payload.status}`,
        );
        void load();
      },
    );
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [user, load]);

  async function changeStatus(id: string, status: OrderStatus) {
    setPendingId(id);
    setError(null);
    try {
      await api.changeOrderStatus(id, status);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'No se pudo cambiar el estado',
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="kicker">Operaciones</p>
          <h1>Pedidos</h1>
        </div>
        <span className="badge">
          <span className={connected ? 'dot' : 'dot off'} />
          {connected ? 'Tiempo real' : 'Sin socket'}
        </span>
      </div>

      {flash ? <p className="flash">{flash}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {orders.length === 0 ? (
        <p className="muted">No hay pedidos todavía.</p>
      ) : (
        <div className="stack">
          {orders.map((order) => {
            const next = ORDER_TRANSITIONS[order.status];
            return (
              <article key={order.id} className="card stack">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <p className="muted">{order.id}</p>
                    <strong>{order.status}</strong>
                    <span className="muted"> · {formatMoney(order.total)}</span>
                  </div>
                  {next.length > 0 ? (
                    <div className="row">
                      {next.map((status) => (
                        <button
                          key={status}
                          className="btn btn-primary"
                          type="button"
                          disabled={pendingId === order.id}
                          onClick={() => void changeStatus(order.id, status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">Estado final</span>
                  )}
                </div>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.productName} × {item.quantity} —{' '}
                      {formatMoney(item.unitPrice)}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
