'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/templates/AuthGuard';
import { AppLayout } from '@/components/templates/AppLayout';
import {
  AnimatedPage,
  AnimatedSection,
} from '@/components/templates/AnimatedPage';
import { TicketCard } from '@/components/molecules/TicketCard';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Ticket } from '@/types';
import { PlusCircle } from 'lucide-react';

export default function MisTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ data: Ticket[] }>('/tickets', token)
      .then((res) => setTickets(res.data))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <AuthGuard roles={['USER', 'TECHNICIAN', 'ADMIN']}>
      <AppLayout title="Mis tickets">
        {isLoading ? (
          <Text variant="muted">Cargando tickets...</Text>
        ) : (
          <AnimatedPage className="mx-auto max-w-4xl space-y-6">
            <AnimatedSection delay={1}>
              <div className="flex items-center justify-between">
                <Text variant="h2">Mis reportes</Text>
                <Link href="/reportar">
                  <Button size="sm">
                    <PlusCircle size={16} />
                    Nuevo reporte
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {!tickets.length && (
              <AnimatedSection delay={2}>
                <Text variant="muted">No tienes tickets reportados aún.</Text>
              </AnimatedSection>
            )}

            <div className="flex flex-col gap-3">
              {tickets.map((ticket, index) => (
                <AnimatedSection
                  key={ticket.id}
                  delay={Math.min(index + 2, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
                >
                  <TicketCard
                    ticket={ticket}
                    href={`/mis-tickets/${ticket.id}`}
                  />
                </AnimatedSection>
              ))}
            </div>
          </AnimatedPage>
        )}
      </AppLayout>
    </AuthGuard>
  );
}
