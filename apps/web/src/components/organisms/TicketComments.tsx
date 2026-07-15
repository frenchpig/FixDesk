// Responsabilidad: hilo de comentarios del ticket + formulario para técnicos
// Usado por: dashboard/tickets/[id], mis-tickets/[id]
// NO hace: cambios de estado ni asignación
'use client';

import { useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { CommentForm } from '@/components/molecules/CommentForm';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { TicketHistoryEntry } from '@/types';

interface TicketCommentsProps {
  ticketId: string;
  entries: TicketHistoryEntry[];
  canComment?: boolean;
  onUpdate: () => void;
}

function isCommentEntry(entry: TicketHistoryEntry) {
  return entry.eventType === 'NOTE_ADDED' && Boolean(entry.note?.trim());
}

export function TicketComments({
  ticketId,
  entries,
  canComment = false,
  onUpdate,
}: TicketCommentsProps) {
  const { token } = useAuth();
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const comments = entries.filter(isCommentEntry);

  async function handleSubmit() {
    const trimmed = note.trim();
    if (!trimmed || !token) return;

    setError('');
    setIsLoading(true);
    try {
      await api.post(`/tickets/${ticketId}/notes`, { note: trimmed }, token);
      setNote('');
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <Text variant="h3">Comentarios</Text>

      {comments.length === 0 ? (
        <Text variant="muted">Aún no hay comentarios en este ticket.</Text>
      ) : (
        <ul className="space-y-3">
          {comments.map((entry) => (
            <li
              key={entry.id}
              className="rounded-theme border border-border bg-surface-secondary p-3"
            >
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <Text variant="body" className="font-medium">
                  {entry.user.name}
                </Text>
                <Text variant="caption">
                  {new Date(entry.createdAt).toLocaleString('es-CL')}
                </Text>
              </div>
              <Text variant="body" className="whitespace-pre-wrap">
                {entry.note}
              </Text>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <CommentForm
          value={note}
          onChange={setNote}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      )}
    </Card>
  );
}
