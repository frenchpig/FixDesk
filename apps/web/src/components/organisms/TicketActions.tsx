'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ALLOWED_TRANSITIONS,
  STATUS_LABELS,
  isNoteRequiredForTransition,
} from '@/lib/constants';
import type { Ticket, TicketStatus } from '@/types';

interface TicketActionsProps {
  ticket: Ticket;
  onUpdate: () => void;
}

function noteFieldLabel(from: TicketStatus, to: TicketStatus): string {
  if (from === 'RESOLVED' || from === 'CANCELLED') {
    return 'Razón de reapertura (obligatoria)';
  }
  if (to === 'PENDING') {
    return 'Motivo del bloqueo (obligatorio)';
  }
  if (to === 'CANCELLED') {
    return 'Razón de cancelación (obligatoria)';
  }
  return 'Nota (opcional)';
}

export function TicketActions({ ticket, onUpdate }: TicketActionsProps) {
  const { token } = useAuth();
  const router = useRouter();
  const nextStatuses = useMemo(
    () => ALLOWED_TRANSITIONS[ticket.status],
    [ticket.status],
  );
  const [status, setStatus] = useState<TicketStatus>(
    () => nextStatuses[0] ?? ticket.status,
  );
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(nextStatuses[0] ?? ticket.status);
    setNote('');
    setError('');
  }, [ticket.status, ticket.id, nextStatuses]);

  const noteRequired = isNoteRequiredForTransition(ticket.status, status);
  const isFinalized =
    ticket.status === 'RESOLVED' || ticket.status === 'CANCELLED';

  async function handleStatusChange() {
    setError('');

    if (!nextStatuses.includes(status)) {
      setError('Selecciona un estado válido');
      return;
    }

    if (noteRequired && !note.trim()) {
      setError('Debes indicar una razón para este cambio de estado');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch(
        `/tickets/${ticket.id}/status`,
        { status, note: note.trim() || undefined },
        token ?? undefined,
      );
      setNote('');
      onUpdate();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssign() {
    setIsLoading(true);
    try {
      await api.patch(`/tickets/${ticket.id}/assign`, {}, token ?? undefined);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <Text variant="h3">Acciones del técnico</Text>

      <Text variant="muted">
        Estado actual: {STATUS_LABELS[ticket.status]}
      </Text>

      {isFinalized && (
        <Text variant="caption" className="text-warning">
          Este ticket está finalizado. Para cambiar el estado debes indicar una
          razón de reapertura.
        </Text>
      )}

      {!ticket.assignee && !isFinalized && (
        <Button variant="secondary" onClick={handleAssign} isLoading={isLoading}>
          Asignarme este ticket
        </Button>
      )}

      {nextStatuses.length === 0 ? (
        <Text variant="muted">No hay cambios de estado disponibles.</Text>
      ) : (
        <>
          <FormField label="Cambiar estado a" htmlFor="status">
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
            >
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={noteFieldLabel(ticket.status, status)}
            htmlFor="note"
          >
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                noteRequired
                  ? 'Explica por qué se realiza este cambio...'
                  : 'Detalle del cambio (opcional)...'
              }
              hasError={Boolean(error) && noteRequired && !note.trim()}
            />
          </FormField>

          {error && (
            <Text variant="caption" className="text-danger">
              {error}
            </Text>
          )}

          <Button onClick={handleStatusChange} isLoading={isLoading}>
            Actualizar estado
          </Button>
        </>
      )}
    </Card>
  );
}
