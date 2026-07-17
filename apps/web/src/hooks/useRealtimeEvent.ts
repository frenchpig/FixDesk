// Responsabilidad: suscribir un componente a un evento del socket compartido.
// Usado por: NotificationsMenu y vistas de tickets (kanban, historial, detalles).
// NO hace: gestionar la conexión (eso vive en lib/realtime-socket).
'use client';

import { useEffect, useRef } from 'react';
import { subscribeRealtime } from '@/lib/realtime-socket';

/**
 * Ejecuta `handler` cada vez que el socket compartido recibe `event`.
 * El handler se guarda en un ref para no re-suscribir en cada render.
 * @param token - JWT del usuario autenticado (null desactiva la suscripción).
 * @param event - nombre del evento Socket.IO (ej. 'ticket:changed').
 * @param handler - callback invocado con el payload del evento.
 */
export function useRealtimeEvent<T = unknown>(
  token: string | null,
  event: string,
  handler: (payload: T) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!token) return;
    const unsubscribe = subscribeRealtime(token, event, (payload) => {
      handlerRef.current(payload as T);
    });
    return unsubscribe;
  }, [token, event]);
}
