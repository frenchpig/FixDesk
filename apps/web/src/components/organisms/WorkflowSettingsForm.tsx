// Responsabilidad: CRUD admin de estados del workflow (crear, editar, ordenar, desactivar)
// Usado por: /configuracion/workflow
// NO hace: mutar tickets ni validar en servidor (el API valida)
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Text } from '@/components/atoms/Text';
import { FormField } from '@/components/molecules/FormField';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useWorkflow } from '@/lib/workflow-context';
import type {
  AdminWorkflowSettings,
  AdminWorkflowState,
  StatusSemantic,
  WorkflowBadgeVariant,
} from '@/types';
import { ArrowDown, ArrowUp, GitBranch, Plus, Trash2 } from 'lucide-react';

const BADGE_OPTIONS: { value: WorkflowBadgeVariant; label: string }[] = [
  { value: 'default', label: 'Neutro' },
  { value: 'primary', label: 'Primario' },
  { value: 'success', label: 'Éxito' },
  { value: 'warning', label: 'Advertencia' },
  { value: 'danger', label: 'Peligro' },
];

const SEMANTIC_OPTIONS: { value: StatusSemantic; label: string }[] = [
  { value: 'OPEN', label: 'Abierto (backlog)' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'PENDING', label: 'En espera' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function WorkflowSettingsForm() {
  const { token } = useAuth();
  const { reload } = useWorkflow();

  const [states, setStates] = useState<AdminWorkflowState[]>([]);
  const [noteOnReopen, setNoteOnReopen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState('');
  const [newSemantic, setNewSemantic] = useState<StatusSemantic>('IN_PROGRESS');
  const [newBadge, setNewBadge] = useState<WorkflowBadgeVariant>('default');
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get<{ data: AdminWorkflowSettings }>(
        '/settings/workflow',
        token,
      );
      setStates(res.data.states);
      setNoteOnReopen(res.data.workflowNoteOnReopen);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateDraft(key: string, patch: Partial<AdminWorkflowState>) {
    setStates((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );
  }

  function toggleTarget(key: string, target: string) {
    setStates((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const next = s.allowedTargets.includes(target)
          ? s.allowedTargets.filter((t) => t !== target)
          : [...s.allowedTargets, target];
        return { ...s, allowedTargets: next };
      }),
    );
  }

  async function runMutation(key: string | null, fn: () => Promise<void>) {
    if (!token) return;
    setSavingKey(key ?? '__global__');
    setError(null);
    setSuccess(null);
    try {
      await fn();
      await reload();
      setSuccess('Cambios guardados. Ya aplican en toda la app.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingKey(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newLabel.trim()) return;
    setIsCreating(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(
        '/settings/workflow/states',
        { label: newLabel.trim(), semantic: newSemantic, badgeVariant: newBadge },
        token,
      );
      setNewLabel('');
      await load();
      await reload();
      setSuccess('Estado creado.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  }

  function handleSaveState(state: AdminWorkflowState) {
    void runMutation(state.key, async () => {
      await api.patch(
        `/settings/workflow/states/${state.key}`,
        {
          label: state.label,
          semantic: state.semantic,
          badgeVariant: state.badgeVariant,
          kanban: state.kanban,
          finalized: state.finalized,
          noteRequiredOnEnter: state.noteRequiredOnEnter,
          allowedTargets: state.allowedTargets,
        },
        token ?? undefined,
      );
      await load();
    });
  }

  function handleMove(state: AdminWorkflowState, direction: -1 | 1) {
    const index = states.findIndex((s) => s.key === state.key);
    const neighbor = states[index + direction];
    if (!neighbor) return;
    void runMutation(state.key, async () => {
      await api.patch(
        `/settings/workflow/states/${state.key}`,
        { order: neighbor.order },
        token ?? undefined,
      );
      await api.patch(
        `/settings/workflow/states/${neighbor.key}`,
        { order: state.order },
        token ?? undefined,
      );
      await load();
    });
  }

  function handleDelete(state: AdminWorkflowState) {
    const confirmed = window.confirm(
      `¿Eliminar el estado «${state.label}»? Si tiene tickets asociados solo se desactivará.`,
    );
    if (!confirmed) return;
    void runMutation(state.key, async () => {
      await api.delete(`/settings/workflow/states/${state.key}`, token ?? undefined);
      await load();
    });
  }

  function handleReactivate(state: AdminWorkflowState) {
    void runMutation(state.key, async () => {
      await api.patch(
        `/settings/workflow/states/${state.key}`,
        { isActive: true },
        token ?? undefined,
      );
      await load();
    });
  }

  function handleSetDefault(key: string) {
    void runMutation(null, async () => {
      await api.patch('/settings/workflow', { defaultStateKey: key }, token ?? undefined);
      await load();
    });
  }

  function handleNoteOnReopen(checked: boolean) {
    setNoteOnReopen(checked);
    void runMutation(null, async () => {
      await api.patch(
        '/settings/workflow',
        { workflowNoteOnReopen: checked },
        token ?? undefined,
      );
    });
  }

  const activeStates = states.filter((s) => s.isActive);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Text variant="h2" className="mb-2">
          Workflow de estados
        </Text>
        <Text variant="muted">
          Crea, edita, ordena y desactiva estados del ticket. Los cambios
          aplican de inmediato al kanban, transiciones y reportería.
        </Text>
      </div>

      {isLoading ? (
        <Text variant="muted">Cargando configuración...</Text>
      ) : (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              <Text variant="h3">Nuevo estado</Text>
            </div>
            <form
              onSubmit={(e) => void handleCreate(e)}
              className="grid gap-3 sm:grid-cols-3"
            >
              <FormField label="Nombre" htmlFor="new-label">
                <Input
                  id="new-label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ej: En revisión"
                  minLength={2}
                  maxLength={40}
                  required
                />
              </FormField>
              <FormField label="Semántica (reportería)" htmlFor="new-semantic">
                <Select
                  id="new-semantic"
                  value={newSemantic}
                  onChange={(e) =>
                    setNewSemantic(e.target.value as StatusSemantic)
                  }
                >
                  {SEMANTIC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Color del badge" htmlFor="new-badge">
                <Select
                  id="new-badge"
                  value={newBadge}
                  onChange={(e) =>
                    setNewBadge(e.target.value as WorkflowBadgeVariant)
                  }
                >
                  {BADGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="sm:col-span-3">
                <Button type="submit" isLoading={isCreating}>
                  Crear estado
                </Button>
              </div>
            </form>
          </Card>

          <Card className="space-y-3">
            <Text variant="h3">Ajustes globales</Text>
            <FormField label="Estado inicial de tickets nuevos" htmlFor="default-state">
              <Select
                id="default-state"
                value={activeStates.find((s) => s.isDefault)?.key ?? ''}
                onChange={(e) => handleSetDefault(e.target.value)}
              >
                {activeStates.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={noteOnReopen}
                onChange={(e) => handleNoteOnReopen(e.target.checked)}
              />
              Exigir nota al salir de un estado finalizado (reapertura)
            </label>
          </Card>

          {states.map((state, index) => (
            <Card
              key={state.key}
              className={`space-y-4 ${state.isActive ? '' : 'opacity-60'}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <GitBranch size={18} className="text-primary" />
                <Text variant="h3">{state.key}</Text>
                {state.isDefault && <Badge variant="primary">Default</Badge>}
                {!state.isActive && <Badge variant="danger">Inactivo</Badge>}
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Subir ${state.label}`}
                    disabled={index === 0 || savingKey !== null}
                    onClick={() => handleMove(state, -1)}
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Bajar ${state.label}`}
                    disabled={index === states.length - 1 || savingKey !== null}
                    onClick={() => handleMove(state, 1)}
                  >
                    <ArrowDown size={16} />
                  </Button>
                  {state.isActive ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Eliminar ${state.label}`}
                      disabled={state.isDefault || savingKey !== null}
                      onClick={() => handleDelete(state)}
                    >
                      <Trash2 size={16} className="text-danger" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={savingKey !== null}
                      onClick={() => handleReactivate(state)}
                    >
                      Reactivar
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Nombre visible" htmlFor={`label-${state.key}`}>
                  <Input
                    id={`label-${state.key}`}
                    value={state.label}
                    onChange={(e) =>
                      updateDraft(state.key, { label: e.target.value })
                    }
                    required
                  />
                </FormField>

                <FormField label="Semántica" htmlFor={`semantic-${state.key}`}>
                  <Select
                    id={`semantic-${state.key}`}
                    value={state.semantic}
                    onChange={(e) =>
                      updateDraft(state.key, {
                        semantic: e.target.value as StatusSemantic,
                      })
                    }
                  >
                    {SEMANTIC_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Color del badge" htmlFor={`badge-${state.key}`}>
                  <Select
                    id={`badge-${state.key}`}
                    value={state.badgeVariant}
                    onChange={(e) =>
                      updateDraft(state.key, {
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
                      updateDraft(state.key, { kanban: e.target.checked })
                    }
                  />
                  Visible en kanban
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.finalized}
                    onChange={(e) =>
                      updateDraft(state.key, { finalized: e.target.checked })
                    }
                  />
                  Estado finalizado
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.noteRequiredOnEnter}
                    onChange={(e) =>
                      updateDraft(state.key, {
                        noteRequiredOnEnter: e.target.checked,
                      })
                    }
                  />
                  Requiere nota al entrar
                </label>
              </div>

              <div className="space-y-2">
                <Text variant="caption" className="text-muted">
                  Transiciones permitidas desde {state.label}
                </Text>
                <div className="flex flex-wrap gap-3">
                  {activeStates
                    .filter((s) => s.key !== state.key)
                    .map((target) => (
                      <label
                        key={target.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={state.allowedTargets.includes(target.key)}
                          onChange={() => toggleTarget(state.key, target.key)}
                        />
                        {target.label}
                      </label>
                    ))}
                </div>
              </div>

              <Button
                type="button"
                isLoading={savingKey === state.key}
                disabled={savingKey !== null && savingKey !== state.key}
                onClick={() => handleSaveState(state)}
              >
                Guardar cambios
              </Button>
            </Card>
          ))}

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
        </div>
      )}
    </div>
  );
}
