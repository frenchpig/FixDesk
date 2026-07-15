'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { PriorityBadge } from '@/components/molecules/PriorityBadge';
import { LabelBadge } from '@/components/molecules/LabelBadge';
import { TicketAttachmentPreview } from '@/components/molecules/TicketAttachmentPreview';
import { TicketTimeline } from '@/components/organisms/TicketTimeline';
import { TicketActions } from '@/components/organisms/TicketActions';
import { TicketComments } from '@/components/organisms/TicketComments';
import { TicketLabelsEditor } from '@/components/organisms/TicketLabelsEditor';
import { TicketDetailsEditor } from '@/components/organisms/TicketDetailsEditor';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CATEGORY_LABELS } from '@/lib/constants';
import type { Ticket, TicketHistoryEntry } from '@/types';

export default function DashboardTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const canManage =
    user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';
  const canComment = canManage;
  const canEditLabels = canManage;
  const canEditDetails = canManage;

  const load = useCallback(() => {
    if (!token || !id) return;
    setIsLoading(true);
    Promise.all([
      api.get<{ data: Ticket }>(`/tickets/${id}`, token),
      api.get<{ data: TicketHistoryEntry[] }>(`/tickets/${id}/history`, token),
    ])
      .then(([ticketRes, historyRes]) => {
        setTicket(ticketRes.data);
        setHistory(historyRes.data);
      })
      .finally(() => setIsLoading(false));
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {isLoading || !ticket ? (
        <Text variant="muted">Cargando...</Text>
      ) : (
        <AnimatedPage key={ticket.id} className="mx-auto max-w-4xl space-y-6">
            <AnimatedSection delay={1}>
              <Card className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Text variant="h2">{ticket.title}</Text>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    {canEditDetails && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditOpen(true)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
                <Text variant="muted">
                  {CATEGORY_LABELS[ticket.category]} · {ticket.location}
                </Text>
                {!!ticket.labels?.length && (
                  <div className="flex flex-wrap gap-2">
                    {ticket.labels.map((label) => (
                      <LabelBadge
                        key={label.id}
                        name={label.name}
                        color={label.color}
                      />
                    ))}
                  </div>
                )}
                <Text variant="body">{ticket.description}</Text>
                <Text variant="caption">
                  Reportado por {ticket.reporter.name}
                  {ticket.assignee && ` · Asignado a ${ticket.assignee.name}`}
                </Text>
              </Card>
            </AnimatedSection>

            {canEditDetails && (
              <TicketDetailsEditor
                ticket={ticket}
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onUpdate={load}
              />
            )}

            {ticket.photoUrl && (
              <AnimatedSection delay={2}>
                <TicketAttachmentPreview photoUrl={ticket.photoUrl} />
              </AnimatedSection>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <AnimatedSection delay={3} className="space-y-6">
                <TicketActions ticket={ticket} onUpdate={load} />
                {canEditLabels && (
                  <TicketLabelsEditor ticket={ticket} onUpdate={load} />
                )}
              </AnimatedSection>
              <AnimatedSection delay={4}>
                <TicketComments
                  ticketId={ticket.id}
                  entries={history}
                  canComment={canComment}
                  onUpdate={load}
                />
              </AnimatedSection>
            </div>

            <AnimatedSection delay={5}>
              <TicketTimeline entries={history} />
            </AnimatedSection>
          </AnimatedPage>
      )}
    </>
  );
}
