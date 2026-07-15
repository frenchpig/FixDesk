'use client';

import { TicketCard } from '@/components/molecules/TicketCard';
import { Text } from '@/components/atoms/Text';
import { STATUS_LABELS, KANBAN_COLUMNS } from '@/lib/constants';
import type { Ticket } from '@/types';

interface KanbanBoardProps {
  tickets: Ticket[];
  basePath?: string;
}

export function KanbanBoard({ tickets, basePath = '/dashboard/tickets' }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((status) => {
        const columnTickets = tickets.filter((t) => t.status === status);
        return (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <Text variant="h3">{STATUS_LABELS[status]}</Text>
              <Text variant="caption">{columnTickets.length}</Text>
            </div>
            <div className="space-y-3">
              {columnTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  href={`${basePath}/${ticket.id}`}
                />
              ))}
              {!columnTickets.length && (
                <Text variant="muted" className="text-center py-8">
                  Sin tickets
                </Text>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
