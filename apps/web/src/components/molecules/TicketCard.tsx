import Link from 'next/link';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { PriorityBadge } from '@/components/molecules/PriorityBadge';
import { CATEGORY_LABELS } from '@/lib/constants';
import { MapPin, Clock } from 'lucide-react';
import type { Ticket } from '@/types';

interface TicketCardProps {
  ticket: Ticket;
  href: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'hace unos minutos';
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function TicketCard({ ticket, href }: TicketCardProps) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Text variant="h3" className="line-clamp-2">
            #{ticket.id.slice(-6)} — {ticket.title}
          </Text>
          <PriorityBadge priority={ticket.priority} />
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <span className="inline-flex items-center rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs text-muted">
            {CATEGORY_LABELS[ticket.category]}
          </span>
        </div>

        <div className="flex items-center gap-4 text-muted">
          <span className="flex items-center gap-1 text-xs">
            <MapPin size={12} />
            {ticket.location}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Clock size={12} />
            {timeAgo(ticket.createdAt)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
