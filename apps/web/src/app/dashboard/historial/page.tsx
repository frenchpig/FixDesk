'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { TicketTable } from '@/components/organisms/TicketTable';
import { HistorialFiltersPanel } from '@/components/organisms/HistorialFiltersPanel';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type {
  HistorialFilters,
  PaginatedMeta,
  PaginatedResponse,
  ReportFilterOptions,
  Ticket,
  TicketLabel,
} from '@/types';

const PER_PAGE = 20;

const EMPTY_META: PaginatedMeta = {
  total: 0,
  page: 1,
  perPage: PER_PAGE,
  totalPages: 0,
};

const DEFAULT_FILTERS: HistorialFilters = {
  q: '',
  status: '',
  priority: '',
  severity: '',
  category: '',
  labelId: '',
  assigneeId: '',
  location: '',
  dateFrom: '',
  dateTo: '',
};

function countActiveFilters(filters: HistorialFilters): number {
  return Object.values(filters).filter((value) => value.trim() !== '').length;
}

function buildQuery(filters: HistorialFilters, page: number): string {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(PER_PAGE),
  });
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.category) params.set('category', filters.category);
  if (filters.labelId) params.set('labelId', filters.labelId);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.location.trim()) params.set('location', filters.location.trim());
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  return params.toString();
}

export default function HistorialPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(EMPTY_META);
  const [page, setPage] = useState(1);
  const [draftFilters, setDraftFilters] =
    useState<HistorialFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<HistorialFilters>(DEFAULT_FILTERS);
  const [labels, setLabels] = useState<TicketLabel[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(
    () => countActiveFilters(appliedFilters),
    [appliedFilters],
  );

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get<{ data: TicketLabel[] }>('/labels', token),
      api.get<{ data: ReportFilterOptions }>('/reports/filters', token),
    ])
      .then(([labelsRes, filtersRes]) => {
        setLabels(labelsRes.data);
        setTechnicians(
          filtersRes.data.technicians.map((t) => ({
            id: t.id,
            name: t.name,
          })),
        );
      })
      .catch(() => {
        setLabels([]);
        setTechnicians([]);
      });
  }, [token]);

  const loadTickets = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    api
      .get<PaginatedResponse<Ticket>>(
        `/tickets?${buildQuery(appliedFilters, page)}`,
        token,
      )
      .then((res) => {
        setTickets(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        setError((err as Error).message);
        setTickets([]);
        setMeta(EMPTY_META);
      })
      .finally(() => setIsLoading(false));
  }, [token, appliedFilters, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  function handleApply() {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  }

  function handleReset() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  return (
    <AnimatedPage className="space-y-6">
      <AnimatedSection delay={1}>
        <div className="space-y-1">
          <Text variant="h2">Historial de tickets</Text>
          <Text variant="muted">
            Combina criterios (estado, prioridad, etiqueta, texto y más) para
            encontrar tickets.
            {activeCount > 0 &&
              ` · ${meta.total} resultado${meta.total === 1 ? '' : 's'}`}
          </Text>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={2}>
        <HistorialFiltersPanel
          filters={draftFilters}
          labels={labels}
          technicians={technicians}
          onChange={setDraftFilters}
          onApply={handleApply}
          onReset={handleReset}
          activeCount={activeCount}
        />
      </AnimatedSection>

      {error && (
        <AnimatedSection delay={3}>
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        </AnimatedSection>
      )}

      <AnimatedSection delay={3} className="relative z-0">
        {isLoading ? (
          <Text variant="muted">Cargando tickets...</Text>
        ) : (
          <TicketTable
            tickets={tickets}
            meta={meta}
            onPageChange={setPage}
          />
        )}
      </AnimatedSection>
    </AnimatedPage>
  );
}
