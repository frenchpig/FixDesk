import { Badge } from '@/components/atoms/Badge';
import { PRIORITY_LABELS } from '@/lib/constants';
import type { TicketPriority } from '@/types';

const priorityVariant: Record<
  TicketPriority,
  'default' | 'warning' | 'danger'
> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'danger',
};

interface PriorityBadgeProps {
  priority: TicketPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge variant={priorityVariant[priority]}>{PRIORITY_LABELS[priority]}</Badge>
  );
}
