import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { formatHours, formatPercent } from '@/lib/report-utils';
import type { ReportKpis } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Timer,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface ReportsKpiGridProps {
  kpis: ReportKpis;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  accent?: 'default' | 'success' | 'warning' | 'danger';
}

const ACCENT_STYLES = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

function KpiCard({ label, value, hint, icon, accent = 'default' }: KpiCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Text
          variant="caption"
          className="text-muted tracking-wide normal-case"
        >
          {label}
        </Text>
        <span className={ACCENT_STYLES[accent]}>{icon}</span>
      </div>
      <Text variant="h2" className="text-2xl font-semibold tabular-nums">
        {value}
      </Text>
      {hint && (
        <Text variant="caption" className="text-muted normal-case">
          {hint}
        </Text>
      )}
    </Card>
  );
}

export function ReportsKpiGrid({ kpis }: ReportsKpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <KpiCard
        label="Creados en período"
        value={kpis.created}
        hint="Tickets reportados"
        icon={<FileText size={18} />}
      />
      <KpiCard
        label="Resueltos"
        value={kpis.resolved}
        hint={`${formatPercent(kpis.resolutionRate)} tasa de resolución`}
        icon={<CheckCircle2 size={18} />}
        accent="success"
      />
      <KpiCard
        label="Backlog abierto"
        value={kpis.openBacklog}
        hint={`${kpis.inProgress} en progreso · ${kpis.pending} pendientes`}
        icon={<TrendingUp size={18} />}
        accent="warning"
      />
      <KpiCard
        label="Alta prioridad abiertos"
        value={kpis.highPriorityOpen}
        icon={<AlertTriangle size={18} />}
        accent="danger"
      />
      <KpiCard
        label="Tiempo medio resolución"
        value={formatHours(kpis.avgResolutionHours)}
        hint="Desde creación hasta cierre"
        icon={<Clock size={18} />}
      />
      <KpiCard
        label="Primera respuesta"
        value={formatHours(kpis.avgFirstResponseHours)}
        hint="Hasta pasar a en progreso"
        icon={<Timer size={18} />}
      />
      <KpiCard
        label={`SLA ≤ ${kpis.slaTargetHours} h`}
        value={formatPercent(kpis.slaComplianceRate)}
        hint={`Resueltos dentro del objetivo (${kpis.slaTargetHours} h)`}
        icon={<CheckCircle2 size={18} />}
        accent="success"
      />
      <KpiCard
        label="Cancelados"
        value={kpis.cancelled}
        hint={`${formatPercent(kpis.cancellationRate)} del período`}
        icon={<XCircle size={18} />}
        accent="danger"
      />
    </div>
  );
}
