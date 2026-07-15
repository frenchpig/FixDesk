'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/templates/AuthGuard';
import { AppLayout } from '@/components/templates/AppLayout';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { PriorityBadge } from '@/components/molecules/PriorityBadge';
import { TicketTimeline } from '@/components/organisms/TicketTimeline';
import { TicketComments } from '@/components/organisms/TicketComments';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CATEGORY_LABELS } from '@/lib/constants';
import type { Ticket, TicketHistoryEntry } from '@/types';

export default function MisTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);

  const load = useCallback(() => {
    if (!token || !id) return;
    Promise.all([
      api.get<{ data: Ticket }>(`/tickets/${id}`, token),
      api.get<{ data: TicketHistoryEntry[] }>(`/tickets/${id}/history`, token),
    ]).then(([ticketRes, historyRes]) => {
      setTicket(ticketRes.data);
      setHistory(historyRes.data);
    });
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ticket) {
    return (
      <AuthGuard>
        <AppLayout title="Detalle">
          <Text variant="muted">Cargando...</Text>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout title={`Ticket #${ticket.id.slice(-6)}`}>
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Text variant="h2">{ticket.title}</Text>
              <div className="flex gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <Text variant="muted">
              {CATEGORY_LABELS[ticket.category]} · {ticket.location}
            </Text>
            <Text variant="body">{ticket.description}</Text>
          </Card>

          <TicketComments
            ticketId={ticket.id}
            entries={history}
            canComment={false}
            onUpdate={load}
          />

          <TicketTimeline entries={history} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
