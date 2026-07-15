// Responsabilidad: panel de filtros combinables del historial de tickets
// Usado por: dashboard/historial
// NO hace: fetch de tickets ni paginación
'use client';

import { Filter } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Text } from '@/components/atoms/Text';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from '@/lib/constants';
import type {
  HistorialFilters,
  TicketCategory,
  TicketLabel,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
} from '@/types';

interface HistorialFiltersPanelProps {
  filters: HistorialFilters;
  labels: TicketLabel[];
  technicians: { id: string; name: string }[];
  onChange: (filters: HistorialFilters) => void;
  onApply: () => void;
  onReset: () => void;
  activeCount: number;
}

export function HistorialFiltersPanel({
  filters,
  labels,
  technicians,
  onChange,
  onApply,
  onReset,
  activeCount,
}: HistorialFiltersPanelProps) {
  function set<K extends keyof HistorialFilters>(
    key: K,
    value: HistorialFilters[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <Card className="relative z-30 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted" />
          <Text variant="h3">Filtros avanzados</Text>
          {activeCount > 0 && (
            <Text variant="caption" className="text-muted">
              {activeCount} activo{activeCount === 1 ? '' : 's'}
            </Text>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Text variant="caption" className="text-muted">
            Texto libre
          </Text>
          <Input
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Título, descripción o ubicación..."
            aria-label="Buscar texto"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onApply();
              }
            }}
          />
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
            Etiqueta
          </Text>
          <Select
            value={filters.labelId}
            onChange={(e) => set('labelId', e.target.value)}
            aria-label="Etiqueta"
          >
            <option value="">Todas</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
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
            aria-label="Técnico asignado"
          >
            <option value="">Todos</option>
            <option value="me">Asignados a mí</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Ubicación
          </Text>
          <Input
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Ej: Lab 3"
            aria-label="Ubicación"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onApply();
              }
            }}
          />
        </div>

        <div className="space-y-1">
          <Text variant="caption" className="text-muted">
            Creado desde
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
            Creado hasta
          </Text>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            aria-label="Fecha hasta"
          />
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
