import Link from 'next/link';
import {
  TableRow,
  TableCell,
} from '@/components/atoms/Table';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { PriorityBadge } from '@/components/molecules/PriorityBadge';
import { CATEGORY_LABELS } from '@/lib/constants';
import { formatDate } from '@/utils/formatDate';
import type { Ticket } from '@/types';

interface TicketTableRowProps {
  ticket: Ticket;
  basePath?: string;
}

export function TicketTableRow({
  ticket,
  basePath = '/dashboard/tickets',
}: TicketTableRowProps) {
  return (
    <TableRow className="cursor-pointer">
      <TableCell>
        <Link
          href={`${basePath}/${ticket.id}`}
          className="font-mono text-xs text-primary hover:underline"
        >
          #{ticket.id.slice(-6)}
        </Link>
      </TableCell>
      <TableCell className="max-w-xs truncate">
        <Link
          href={`${basePath}/${ticket.id}`}
          className="hover:text-primary hover:underline"
        >
          {ticket.title}
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={ticket.status} />
      </TableCell>
      <TableCell>
        <PriorityBadge priority={ticket.priority} />
      </TableCell>
      <TableCell className="text-muted">
        {CATEGORY_LABELS[ticket.category]}
      </TableCell>
      <TableCell className="max-w-[10rem] truncate text-muted">
        {ticket.location}
      </TableCell>
      <TableCell className="text-muted">
        {ticket.reporter.name}
      </TableCell>
      <TableCell className="text-muted">
        {ticket.assignee?.name ?? '—'}
      </TableCell>
      <TableCell className="text-muted">
        {formatDate(ticket.createdAt)}
      </TableCell>
      <TableCell className="text-muted">
        {ticket.resolvedAt ? formatDate(ticket.resolvedAt) : '—'}
      </TableCell>
    </TableRow>
  );
}
