// Responsabilidad: formulario admin para editar labels, flags, colores y transiciones del workflow
// Usado por: /configuracion/workflow
// NO hace: mutar tickets ni validar en servidor (el API valida)
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Text } from '@/components/atoms/Text';
import { FormField } from '@/components/molecules/FormField';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useWorkflow } from '@/lib/workflow-context';
import { FALLBACK_WORKFLOW } from '@/lib/workflow-helpers';
import type {
  TicketStatus,
  WorkflowBadgeVariant,
  WorkflowPayload,
  WorkflowState,
} from '@/types';
import { GitBranch } from 'lucide-react';

const BADGE_OPTIONS: { value: WorkflowBadgeVariant; label: string }[] = [
  { value: 'default', label: 'Neutro' },
  { value: 'primary', label: 'Primario' },
  { value: 'success', label: 'Éxito' },
  { value: 'warning', label: 'Advertencia' },
  { value: 'danger', label: 'Peligro' },
];

type Draft = WorkflowPayload;

function cloneWorkflow(payload: WorkflowPayload): Draft {
  return {
    states: payload.states.map((s) => ({ ...s })),
    transitions: Object.fromEntries(
      Object.entries(payload.transitions).map(([k, v]) => [k, [...v]]),
    ) as Record<TicketStatus, TicketStatus[]>,
    noteRequired: {
      entering: [...payload.noteRequired.entering],
      leavingFinalized: payload.noteRequired.leavingFinalized,
    },
  };
}

export function WorkflowSettingsForm() {
  const { token } = useAuth();
  const { reload } = useWorkflow();
  const [draft, setDraft] = useState<Draft>(() =>
    cloneWorkflow(FALLBACK_WORKFLOW),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    api
      .get<{ data: WorkflowPayload }>('/settings/workflow', token)
      .then((res) => {
        setDraft(cloneWorkflow(res.data));
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function updateState(id: TicketStatus, patch: Partial<WorkflowState>) {
    setDraft((prev) => ({
      ...prev,
      states: prev.states.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function toggleTransition(from: TicketStatus, to: TicketStatus) {
    setDraft((prev) => {
      const current = prev.transitions[from] ?? [];
      const next = current.includes(to)
        ? current.filter((s) => s !== to)
        : [...current, to];
      return {
        ...prev,
        transitions: { ...prev.transitions, [from]: next },
      };
    });
  }

  function toggleNoteEntering(status: TicketStatus) {
    setDraft((prev) => {
      const entering = prev.noteRequired.entering.includes(status)
        ? prev.noteRequired.entering.filter((s) => s !== status)
        : [...prev.noteRequired.entering, status];
      return {
        ...prev,
        noteRequired: { ...prev.noteRequired, entering },
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!draft.states.some((s) => s.kanban)) {
      setError('Debe haber al menos un estado visible en kanban');
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.patch<{ data: WorkflowPayload }>(
        '/settings/workflow',
        {
          states: draft.states,
          transitions: draft.transitions,
          noteRequired: draft.noteRequired,
        },
        token,
      );
      setDraft(cloneWorkflow(res.data));
      await reload();
      setSuccess('Workflow guardado. Los cambios ya aplican en toda la app.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Text variant="h2" className="mb-2">
          Workflow de estados
        </Text>
        <Text variant="muted">
          Personaliza nombres, colores, columnas del kanban, transiciones
          permitidas y cuándo se exige una nota. Los 5 estados del sistema
          (OPEN…CANCELLED) no se pueden agregar ni eliminar.
        </Text>
      </div>

      {isLoading ? (
        <Text variant="muted">Cargando configuración...</Text>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {draft.states.map((state) => (
            <Card key={state.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <GitBranch size={18} className="text-primary" />
                <Text variant="h3">{state.id}</Text>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Nombre visible" htmlFor={`label-${state.id}`}>
                  <Input
                    id={`label-${state.id}`}
                    value={state.label}
                    onChange={(e) =>
                      updateState(state.id, { label: e.target.value })
                    }
                    required
                  />
                </FormField>

                <FormField
                  label="Color del badge"
                  htmlFor={`badge-${state.id}`}
                >
                  <Select
                    id={`badge-${state.id}`}
                    value={state.badgeVariant}
                    onChange={(e) =>
                      updateState(state.id, {
                        badgeVariant: e.target.value as WorkflowBadgeVariant,
                      })
                    }
                  >
                    {BADGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.kanban}
                    onChange={(e) =>
                      updateState(state.id, { kanban: e.target.checked })
                    }
                  />
                  Visible en kanban
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.finalized}
                    onChange={(e) =>
                      updateState(state.id, { finalized: e.target.checked })
                    }
                  />
                  Estado finalizado
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.noteRequired.entering.includes(state.id)}
                    onChange={() => toggleNoteEntering(state.id)}
                  />
                  Requiere nota al entrar
                </label>
              </div>

              <div className="space-y-2">
                <Text variant="caption" className="text-muted">
                  Transiciones permitidas desde {state.label}
                </Text>
                <div className="flex flex-wrap gap-3">
                  {draft.states
                    .filter((s) => s.id !== state.id)
                    .map((target) => (
                      <label
                        key={target.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={(
                            draft.transitions[state.id] ?? []
                          ).includes(target.id)}
                          onChange={() =>
                            toggleTransition(state.id, target.id)
                          }
                        />
                        {target.label}
                      </label>
                    ))}
                </div>
              </div>
            </Card>
          ))}

          <Card className="space-y-3">
            <Text variant="h3">Notas al reabrir</Text>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.noteRequired.leavingFinalized}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    noteRequired: {
                      ...prev.noteRequired,
                      leavingFinalized: e.target.checked,
                    },
                  }))
                }
              />
              Exigir nota al salir de un estado finalizado
            </label>
          </Card>

          {error && (
            <Text variant="caption" className="text-danger">
              {error}
            </Text>
          )}
          {success && (
            <Text variant="caption" className="text-success">
              {success}
            </Text>
          )}

          <Button type="submit" isLoading={isSaving}>
            Guardar workflow
          </Button>
        </form>
      )}
    </div>
  );
}
