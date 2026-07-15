'use client';

import { useEffect, useState } from 'react';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { KanbanBoard } from '@/components/organisms/KanbanBoard';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Ticket } from '@/types';

type Filter = 'all' | 'mine' | 'high';

export default function DashboardPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams({ createdToday: 'true' });
    if (filter === 'mine') params.set('assigneeId', 'me');
    if (filter === 'high') params.set('priority', 'HIGH');

    setIsLoading(true);
    api
      .get<{ data: Ticket[] }>(`/tickets?${params.toString()}`, token)
      .then((res) => setTickets(res.data))
      .finally(() => setIsLoading(false));
  }, [token, filter]);

  return (
    <>
      {isLoading ? (
        <Text variant="muted">Cargando tickets...</Text>
      ) : (
        <AnimatedPage key={filter} className="space-y-6">
          <AnimatedSection delay={1}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Text variant="h2">Tablero Kanban — Hoy</Text>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'Todos'],
                    ['mine', 'Mis asignados'],
                    ['high', 'Alta prioridad'],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={filter === key ? 'primary' : 'secondary'}
                    onClick={() => setFilter(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={2}>
            <KanbanBoard tickets={tickets} />
          </AnimatedSection>
        </AnimatedPage>
      )}
    </>
  );
}
