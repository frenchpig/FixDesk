// Responsabilidad: mantener una única conexión Socket.IO compartida por token
//   con ref-count, y multiplexar suscripciones a eventos entre vistas.
// Usado por: useRealtimeEvent (y a través de él, NotificationsMenu y vistas de tickets)
// NO hace: refetch de datos ni lógica de UI; solo transporta eventos.
'use client';

import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function resolveSocketBaseUrl(apiUrl: string): string {
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

type EventHandler = (payload: unknown) => void;

interface SharedConnection {
  socket: Socket;
  subscribers: number;
  handlers: Map<string, Set<EventHandler>>;
}

let current: { token: string; connection: SharedConnection } | null = null;

function createConnection(token: string): SharedConnection {
  const baseUrl = resolveSocketBaseUrl(API_URL);
  const socket = io(`${baseUrl}/notifications`, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
  });

  socket.on('connect_error', () => {
    /* silencioso: las vistas mantienen su fallback (polling / recarga manual) */
  });

  return { socket, subscribers: 0, handlers: new Map() };
}

function teardown() {
  if (!current) return;
  current.connection.socket.removeAllListeners();
  current.connection.socket.disconnect();
  current = null;
}

/**
 * Suscribe un handler a un evento del socket compartido para el token dado.
 * Abre la conexión si no existe y la cierra cuando no quedan suscriptores.
 * @returns función para cancelar la suscripción.
 */
export function subscribeRealtime(
  token: string,
  event: string,
  handler: EventHandler,
): () => void {
  if (!token) return () => {};

  // Si cambió el token, cerrar la conexión previa antes de abrir la nueva.
  if (current && current.token !== token) {
    teardown();
  }

  if (!current) {
    current = { token, connection: createConnection(token) };
  }

  const { connection } = current;
  connection.subscribers += 1;

  let handlers = connection.handlers.get(event);
  if (!handlers) {
    handlers = new Set();
    connection.handlers.set(event, handlers);
    connection.socket.on(event, (payload: unknown) => {
      const currentHandlers = current?.connection.handlers.get(event);
      currentHandlers?.forEach((fn) => fn(payload));
    });
  }
  handlers.add(handler);

  return () => {
    if (!current) return;
    const conn = current.connection;
    const set = conn.handlers.get(event);
    set?.delete(handler);
    if (set && set.size === 0) {
      conn.handlers.delete(event);
      conn.socket.off(event);
    }
    conn.subscribers -= 1;
    if (conn.subscribers <= 0) {
      teardown();
    }
  };
}
