'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { Text } from '@/components/atoms/Text';
import { Button } from '@/components/atoms/Button';
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
  SEVERITY_LABELS,
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
  severity: '',
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
  if (filters.severity) params.set('severity', filters.severity);
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
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

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

  async function handleExport(format: 'excel' | 'pdf') {
    if (!token) return;
    setExporting(format);
    setError(null);
    const query = buildQuery(appliedFilters);
    try {
      await api.download(
        `/reports/export/${format}?${query}`,
        token,
        `fixdesk-reportes.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(null);
    }
  }

  const periodLabel = metrics
    ? `${new Date(metrics.period.from).toLocaleDateString('es-CL')} — ${new Date(metrics.period.to).toLocaleDateString('es-CL')}`
    : '';

  return (
    <AnimatedPage className="space-y-6">
      <AnimatedSection delay={1}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <Text variant="h2">Reportería y KPIs</Text>
            <Text variant="muted">
              Métricas operativas con filtros por período, área, personas y
              estado.
              {periodLabel && ` Período: ${periodLabel}.`}
            </Text>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!metrics || exporting !== null}
              isLoading={exporting === 'excel'}
              onClick={() => handleExport('excel')}
            >
              Excel
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!metrics || exporting !== null}
              isLoading={exporting === 'pdf'}
              onClick={() => handleExport('pdf')}
            >
              PDF
            </Button>
          </div>
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
                title="Por severidad"
                items={metrics.bySeverity.map((r) => ({
                  label: SEVERITY_LABELS[r.severity],
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
