'use client';

import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { useWorkflow } from '@/lib/workflow-context';
import type { TicketHistoryEntry, TicketStatus } from '@/types';

interface TicketTimelineProps {
  entries: TicketHistoryEntry[];
}

function formatEvent(
  entry: TicketHistoryEntry,
  labelOf: (status: TicketStatus) => string,
) {
  switch (entry.eventType) {
    case 'CREATED':
      return `${entry.user.name} creó el ticket`;
    case 'STATUS_CHANGED':
      return `${entry.user.name} cambió el estado: ${entry.oldStatus ? labelOf(entry.oldStatus) : ''} → ${entry.newStatus ? labelOf(entry.newStatus) : ''}`;
    case 'ASSIGNED':
      return `${entry.user.name} asignó el ticket`;
    case 'NOTE_ADDED':
      return `${entry.user.name} agregó un comentario`;
    case 'PHOTO_ADDED':
      return `${entry.user.name} adjuntó una captura${entry.note ? `: ${entry.note}` : ''}`;
    case 'UPDATED':
      return `${entry.user.name} editó el ticket`;
    default:
      return `${entry.user.name} registró un evento`;
  }
}

export function TicketTimeline({ entries }: TicketTimelineProps) {
  const { getStatusLabel } = useWorkflow();

  if (!entries.length) {
    return (
      <Card>
        <Text variant="muted">Sin historial aún.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text variant="h3" className="mb-4">
        Historial
      </Text>
      <ol className="space-y-4">
        {entries.map((entry) => (
          <li key={entry.id} className="border-l-2 border-primary/30 pl-4">
            <Text variant="caption">
              {new Date(entry.createdAt).toLocaleString('es-CL')}
            </Text>
            <Text variant="body">{formatEvent(entry, getStatusLabel)}</Text>
            {entry.note && (
              <Text variant="muted" className="mt-1 italic">
                &ldquo;{entry.note}&rdquo;
              </Text>
            )}
            {entry.newStatus && entry.eventType === 'STATUS_CHANGED' && (
              <div className="mt-2">
                <StatusBadge status={entry.newStatus} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
