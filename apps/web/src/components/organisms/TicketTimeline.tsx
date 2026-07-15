import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { STATUS_LABELS } from '@/lib/constants';
import type { TicketHistoryEntry } from '@/types';

interface TicketTimelineProps {
  entries: TicketHistoryEntry[];
}

function formatEvent(entry: TicketHistoryEntry) {
  switch (entry.eventType) {
    case 'CREATED':
      return `${entry.user.name} creó el ticket`;
    case 'STATUS_CHANGED':
      return `${entry.user.name} cambió el estado: ${entry.oldStatus ? STATUS_LABELS[entry.oldStatus] : ''} → ${entry.newStatus ? STATUS_LABELS[entry.newStatus] : ''}`;
    case 'ASSIGNED':
      return `${entry.user.name} asignó el ticket`;
    case 'NOTE_ADDED':
      return `${entry.user.name} agregó un comentario`;
    default:
      return `${entry.user.name} registró un evento`;
  }
}

export function TicketTimeline({ entries }: TicketTimelineProps) {
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
            <Text variant="body">{formatEvent(entry)}</Text>
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
