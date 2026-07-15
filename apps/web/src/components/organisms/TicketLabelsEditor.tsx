// Responsabilidad: editar etiquetas de un ticket (técnico)
// Usado por: detalle dashboard
// NO hace: catálogo de creación de labels
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { LabelPicker } from '@/components/molecules/LabelPicker';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Ticket, TicketLabel } from '@/types';

interface TicketLabelsEditorProps {
  ticket: Ticket;
  onUpdate: () => void;
}

export function TicketLabelsEditor({
  ticket,
  onUpdate,
}: TicketLabelsEditorProps) {
  const { token } = useAuth();
  const [options, setOptions] = useState<TicketLabel[]>([]);
  const [selectedIds, setSelectedIds] = useState(
    () => ticket.labels?.map((l) => l.id) ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedIds(ticket.labels?.map((l) => l.id) ?? []);
  }, [ticket.id, ticket.labels]);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ data: TicketLabel[] }>('/labels', token)
      .then((res) => setOptions(res.data))
      .catch(() => setOptions([]));
  }, [token]);

  async function handleSave() {
    if (!token) return;
    setError('');
    setIsLoading(true);
    try {
      await api.patch(
        `/tickets/${ticket.id}/labels`,
        { labelIds: selectedIds },
        token,
      );
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  const dirty =
    JSON.stringify([...(ticket.labels?.map((l) => l.id) ?? [])].sort()) !==
    JSON.stringify([...selectedIds].sort());

  return (
    <Card className="space-y-3">
      <Text variant="h3">Etiquetas</Text>
      <LabelPicker
        options={options}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
        disabled={isLoading}
      />
      {error && (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      )}
      <Button
        size="sm"
        onClick={() => void handleSave()}
        isLoading={isLoading}
        disabled={!dirty}
      >
        Guardar etiquetas
      </Button>
    </Card>
  );
}
