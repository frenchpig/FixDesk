// Responsabilidad: campana in-app con listado, badge y marcar leídas
// Usado por: AppHeader
// NO hace: websockets ni envío de notificaciones
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAnimationsEnabled } from '@/lib/theme/theme-provider';
import type { AppNotification, PaginatedResponse } from '@/types';

const CLOSE_MS = 180;
const POLL_MS = 30_000;

function ticketHref(role: string | undefined, ticketId: string) {
  if (role === 'USER') return `/mis-tickets/${ticketId}`;
  return `/dashboard/tickets/${ticketId}`;
}

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export function NotificationsMenu() {
  const { user, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const animationsEnabled = useAnimationsEnabled();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMs = animationsEnabled ? CLOSE_MS : 0;

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const close = useCallback(() => {
    if (!animationsEnabled) {
      setOpen(false);
      setClosing(false);
      return;
    }
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, closeMs);
  }, [animationsEnabled, closeMs]);

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get<{ count: number }>(
        '/notifications/unread-count',
        token,
      );
      setUnread(res.count);
    } catch {
      /* silencioso en poll */
    }
  }, [token]);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await api.get<PaginatedResponse<AppNotification>>(
        '/notifications?perPage=15',
        token,
      );
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void fetchUnread();
    const id = window.setInterval(() => {
      void fetchUnread();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [token, fetchUnread]);

  useEffect(() => {
    if (open) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cerrar al navegar
  }, [pathname]);

  useEffect(() => {
    if (!open || closing) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closing, close]);

  async function handleOpen() {
    if (open) {
      close();
      return;
    }
    setOpen(true);
    await Promise.all([fetchList(), fetchUnread()]);
  }

  async function markOne(id: string) {
    if (!token) return;
    await api.patch(`/notifications/${id}/read`, {}, token);
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
      ),
    );
    setUnread((c) => Math.max(0, c - 1));
  }

  async function markAll() {
    if (!token) return;
    await api.patch('/notifications/read-all', {}, token);
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
    );
    setUnread(0);
  }

  async function openNotification(n: AppNotification) {
    if (!n.readAt) {
      try {
        await markOne(n.id);
      } catch {
        /* continuar navegación */
      }
    }
    close();
    if (n.ticketId) {
      router.push(ticketHref(user?.role, n.ticketId));
    }
  }

  if (!user || !token) return null;

  const isVisible = open || closing;
  const badgeLabel = unread > 99 ? '99+' : String(unread);

  return (
    <div ref={menuRef} className="relative z-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void handleOpen()}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Notificaciones"
        className={cn('relative', open && 'bg-surface-secondary')}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center',
              'rounded-full bg-danger px-1 text-[10px] font-semibold text-on-danger',
            )}
          >
            {badgeLabel}
          </span>
        )}
      </Button>

      {isVisible && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full z-[100] mt-2 w-80 max-w-[calc(100vw-2rem)]',
            'rounded-theme border border-border bg-surface overlay-surface p-1 shadow-theme',
            animationsEnabled &&
              (closing ? 'animate-menu-panel-out' : 'animate-menu-panel-in'),
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <Text variant="body" className="font-medium">
              Notificaciones
            </Text>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => void markAll()}
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {loadingList ? (
              <Text variant="muted" className="px-3 py-4">
                Cargando...
              </Text>
            ) : items.length === 0 ? (
              <Text variant="muted" className="px-3 py-4">
                No tienes notificaciones.
              </Text>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  onClick={() => void openNotification(n)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 rounded-theme px-3 py-2.5 text-left transition-theme',
                    'hover:bg-surface-secondary',
                    !n.readAt && 'bg-primary/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Text
                      variant="body"
                      className={cn('text-sm', !n.readAt && 'font-medium')}
                    >
                      {n.title}
                    </Text>
                    {!n.readAt && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.body && (
                    <Text variant="caption" className="line-clamp-2">
                      {n.body}
                    </Text>
                  )}
                  <Text variant="caption">{formatRelative(n.createdAt)}</Text>
                </button>
              ))
            )}
          </div>

          {user.role === 'USER' && (
            <div className="border-t border-border px-3 py-2">
              <Link
                href="/mis-tickets"
                className="text-xs text-muted hover:text-foreground"
                onClick={close}
              >
                Ver mis tickets
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
