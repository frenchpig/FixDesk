'use client';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Text } from '@/components/atoms/Text';
import { Card } from '@/components/atoms/Card';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from '@/lib/constants';
import type {
  DatePreset,
  ReportFilterOptions,
  ReportFilters,
  TicketCategory,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
} from '@/types';
import { Filter } from 'lucide-react';

const PRESET_LABELS: Record<DatePreset, string> = {
  last7: 'Últimos 7 días',
  last30: 'Últimos 30 días',
  last90: 'Últimos 90 días',
  thisMonth: 'Este mes',
  custom: 'Personalizado',
};

interface ReportsFiltersProps {
  filters: ReportFilters;
  options: ReportFilterOptions | null;
  onChange: (filters: ReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function ReportsFilters({
  filters,
  options,
  onChange,
  onApply,
  onReset,
}: ReportsFiltersProps) {
  function set<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-muted" />
        <Text variant="h3">Filtros de reportería</Text>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Período
          </Text>
          <Select
            value={filters.preset}
            onChange={(e) => set('preset', e.target.value as DatePreset)}
            aria-label="Período"
          >
            {(Object.keys(PRESET_LABELS) as DatePreset[]).map((p) => (
              <option key={p} value={p}>
                {PRESET_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>

        {filters.preset === 'custom' && (
          <>
            <div className="space-y-1">
              <Text variant="caption" className="text-muted">
                Desde
              </Text>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => set('dateFrom', e.target.value)}
                aria-label="Fecha desde"
              />
            </div>
            <div className="space-y-1">
              <Text variant="caption" className="text-muted">
                Hasta
              </Text>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => set('dateTo', e.target.value)}
                aria-label="Fecha hasta"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Categoría
          </Text>
          <Select
            value={filters.category}
            onChange={(e) =>
              set('category', e.target.value as TicketCategory | '')
            }
            aria-label="Categoría"
          >
            <option value="">Todas</option>
            {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Estado
          </Text>
          <Select
            value={filters.status}
            onChange={(e) => set('status', e.target.value as TicketStatus | '')}
            aria-label="Estado"
          >
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Prioridad
          </Text>
          <Select
            value={filters.priority}
            onChange={(e) =>
              set('priority', e.target.value as TicketPriority | '')
            }
            aria-label="Prioridad"
          >
            <option value="">Todas</option>
            {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Severidad
          </Text>
          <Select
            value={filters.severity}
            onChange={(e) =>
              set('severity', e.target.value as TicketSeverity | '')
            }
            aria-label="Severidad"
          >
            <option value="">Todas</option>
            {(Object.keys(SEVERITY_LABELS) as TicketSeverity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Área
          </Text>
          <Select
            value={filters.areaId}
            onChange={(e) => set('areaId', e.target.value)}
            aria-label="Área"
          >
            <option value="">Todas</option>
            {options?.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Técnico asignado
          </Text>
          <Select
            value={filters.assigneeId}
            onChange={(e) => set('assigneeId', e.target.value)}
            aria-label="Técnico"
          >
            <option value="">Todos</option>
            {options?.technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Reportado por
          </Text>
          <Select
            value={filters.reporterId}
            onChange={(e) => set('reporterId', e.target.value)}
            aria-label="Reportador"
          >
            <option value="">Todos</option>
            {options?.reporters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onApply}>
          Aplicar filtros
        </Button>
        <Button size="sm" variant="secondary" onClick={onReset}>
          Restablecer
        </Button>
      </div>
    </Card>
  );
}
