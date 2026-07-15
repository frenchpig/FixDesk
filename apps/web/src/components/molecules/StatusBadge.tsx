import { Badge } from '@/components/atoms/Badge';
import { STATUS_LABELS } from '@/lib/constants';
import type { TicketStatus } from '@/types';

const statusVariant: Record<
  TicketStatus,
  'default' | 'primary' | 'success' | 'warning' | 'danger'
> = {
  OPEN: 'default',
  IN_PROGRESS: 'primary',
  PENDING: 'warning',
  RESOLVED: 'success',
  CANCELLED: 'danger',
};

interface StatusBadgeProps {
  status: TicketStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariant[status]}>{STATUS_LABELS[status]}</Badge>;
}
