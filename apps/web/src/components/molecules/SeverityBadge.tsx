// Responsabilidad: badge visual de severidad (impacto) del ticket
// Usado por: cards, tablas, detalle
// NO hace: priorización operativa (usar PriorityBadge)
import { Badge } from '@/components/atoms/Badge';
import { SEVERITY_LABELS } from '@/lib/constants';
import type { TicketSeverity } from '@/types';

const severityVariant: Record<
  TicketSeverity,
  'default' | 'primary' | 'warning' | 'danger'
> = {
  LOW: 'default',
  MEDIUM: 'primary',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

interface SeverityBadgeProps {
  severity: TicketSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <Badge variant={severityVariant[severity]}>
      Sev. {SEVERITY_LABELS[severity]}
    </Badge>
  );
}
