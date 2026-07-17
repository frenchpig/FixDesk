'use client';

import { Badge } from '@/components/atoms/Badge';
import { useWorkflow } from '@/lib/workflow-context';
import type { TicketStatus } from '@/types';

interface StatusBadgeProps {
  status: TicketStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { getStatusLabel, getStatusBadgeVariant } = useWorkflow();
  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
