'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { Text } from '@/components/atoms/Text';
import { ReportsFilters } from '@/components/organisms/ReportsFilters';
import { ReportsKpiGrid } from '@/components/organisms/ReportsKpiGrid';
import {
  ReportsReporterTable,
  ReportsTechnicianTable,
} from '@/components/organisms/ReportsBreakdownTables';
import { ReportsBarChart } from '@/components/molecules/ReportsBarChart';
import { ReportsTrendChart } from '@/components/molecules/ReportsTrendChart';
import { api } from '@/lib/api';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '@/lib/constants';
import { resolveDateRange } from '@/lib/report-utils';
import { useAuth } from '@/lib/auth-context';
import type {
  ReportFilterOptions,
  ReportFilters,
  ReportsMetrics,
} from '@/types';

const DEFAULT_FILTERS: ReportFilters = {
  preset: 'last30',
  dateFrom: '',
  dateTo: '',
  category: '',
  status: '',
  priority: '',
  areaId: '',
  assigneeId: '',
  reporterId: '',
};

function buildQuery(filters: ReportFilters): string {
  const { dateFrom, dateTo } = resolveDateRange(
    filters.preset,
    filters.dateFrom,
    filters.dateTo,
  );
  const params = new URLSearchParams({ dateFrom, dateTo });
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.areaId) params.set('areaId', filters.areaId);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.reporterId) params.set('reporterId', filters.reporterId);
  return params.toString();
}

export default function ReportesPage() {
  const { token } = useAuth();
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ReportFilters>(DEFAULT_FILTERS);
  const [options, setOptions] = useState<ReportFilterOptions | null>(null);
  const [metrics, setMetrics] = useState<ReportsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ data: ReportFilterOptions }>('/reports/filters', token)
      .then((res) => setOptions(res.data))
      .catch(() => setOptions({ areas: [], technicians: [], reporters: [] }));
  }, [token]);

  const loadMetrics = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    const query = buildQuery(appliedFilters);
    api
      .get<{ data: ReportsMetrics }>(`/reports/metrics?${query}`, token)
      .then((res) => setMetrics(res.data))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [token, appliedFilters]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  function handleApply() {
    setAppliedFilters({ ...draftFilters });
  }

  function handleReset() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }

  const periodLabel = metrics
    ? `${new Date(metrics.period.from).toLocaleDateString('es-CL')} — ${new Date(metrics.period.to).toLocaleDateString('es-CL')}`
    : '';

  return (
    <AnimatedPage className="space-y-6">
      <AnimatedSection delay={1}>
        <div className="space-y-1">
          <Text variant="h2">Reportería y KPIs</Text>
          <Text variant="muted">
            Métricas operativas con filtros por período, área, personas y
            estado.
            {periodLabel && ` Período: ${periodLabel}.`}
          </Text>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={2}>
        <ReportsFilters
          filters={draftFilters}
          options={options}
          onChange={setDraftFilters}
          onApply={handleApply}
          onReset={handleReset}
        />
      </AnimatedSection>

      {error && (
        <AnimatedSection delay={3}>
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        </AnimatedSection>
      )}

      {isLoading && (
        <AnimatedSection delay={3}>
          <Text variant="muted">Cargando métricas...</Text>
        </AnimatedSection>
      )}

      {!isLoading && metrics && (
        <>
          <AnimatedSection delay={3}>
            <ReportsKpiGrid kpis={metrics.kpis} />
          </AnimatedSection>

          <AnimatedSection delay={4}>
            <ReportsTrendChart title="Tendencia diaria" data={metrics.trends} />
          </AnimatedSection>

          <AnimatedSection delay={5}>
            <div className="grid gap-6 lg:grid-cols-2">
              <ReportsBarChart
                title="Por estado"
                items={metrics.byStatus.map((r) => ({
                  label: STATUS_LABELS[r.status],
                  value: r.count,
                }))}
              />
              <ReportsBarChart
                title="Por categoría"
                items={metrics.byCategory.map((r) => ({
                  label: CATEGORY_LABELS[r.category],
                  value: r.count,
                }))}
              />
              <ReportsBarChart
                title="Por prioridad"
                items={metrics.byPriority.map((r) => ({
                  label: PRIORITY_LABELS[r.priority],
                  value: r.count,
                }))}
              />
              <ReportsBarChart
                title="Por área"
                items={metrics.byArea.map((r) => ({
                  label: r.areaName,
                  value: r.count,
                }))}
              />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={6}>
            <div className="grid gap-6 lg:grid-cols-2">
              <ReportsTechnicianTable items={metrics.byTechnician} />
              <ReportsReporterTable items={metrics.byReporter} />
            </div>
          </AnimatedSection>
        </>
      )}
    </AnimatedPage>
  );
}
