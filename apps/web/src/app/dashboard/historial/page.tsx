'use client';

import { useEffect, useState } from 'react';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { TicketTable } from '@/components/organisms/TicketTable';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/constants';
import type {
  PaginatedMeta,
  PaginatedResponse,
  Ticket,
  TicketLabel,
  TicketPriority,
  TicketStatus,
} from '@/types';

const PER_PAGE = 20;

const EMPTY_META: PaginatedMeta = {
  total: 0,
  page: 1,
  perPage: PER_PAGE,
  totalPages: 0,
};

export default function HistorialPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(EMPTY_META);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [labelId, setLabelId] = useState('');
  const [labels, setLabels] = useState<TicketLabel[]>([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ data: TicketLabel[] }>('/labels', token)
      .then((res) => setLabels(res.data))
      .catch(() => setLabels([]));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams({
      page: String(page),
      perPage: String(PER_PAGE),
    });
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (labelId) params.set('labelId', labelId);
    if (appliedSearch) params.set('q', appliedSearch);

    setIsLoading(true);
    api
      .get<PaginatedResponse<Ticket>>(`/tickets?${params.toString()}`, token)
      .then((res) => {
        setTickets(res.data);
        setMeta(res.meta);
      })
      .finally(() => setIsLoading(false));
  }, [token, page, status, priority, labelId, appliedSearch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  function handleStatusChange(value: string) {
    setPage(1);
    setStatus(value as TicketStatus | '');
  }

  function handlePriorityChange(value: string) {
    setPage(1);
    setPriority(value as TicketPriority | '');
  }

  function handleLabelChange(value: string) {
    setPage(1);
    setLabelId(value);
  }

  return (
    <AnimatedPage className="space-y-6">
      <AnimatedSection delay={1} className="relative z-30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Text variant="h2">Historial de tickets</Text>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-center gap-2"
          >
            <Select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-auto min-w-[10rem]"
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>

            <Select
              value={priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-auto min-w-[10rem]"
              aria-label="Filtrar por prioridad"
            >
              <option value="">Todas las prioridades</option>
              {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>

            <Select
              value={labelId}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-auto min-w-[10rem]"
              aria-label="Filtrar por etiqueta"
            >
              <option value="">Todas las etiquetas</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </Select>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-48"
              aria-label="Buscar tickets"
            />

            <Button type="submit" size="sm" variant="secondary">
              Buscar
            </Button>
          </form>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={2} className="relative z-0">
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
