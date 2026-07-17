// Responsabilidad: cargar GET /workflow una vez y exponerlo a la UI autenticada
// Usado por: root layout (dentro de AuthProvider) y consumidores via useWorkflow
// NO hace: mutar estados ni validar transiciones en servidor
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  FALLBACK_WORKFLOW,
  getAllowedTransitions,
  getKanbanColumns,
  getStatusBadgeVariant,
  getStatusLabel,
  getStatusLabels,
  isFinalizedStatus,
  isNoteRequiredForTransition,
  listStatuses,
} from '@/lib/workflow-helpers';
import type {
  TicketStatus,
  WorkflowBadgeVariant,
  WorkflowPayload,
} from '@/types';

interface WorkflowContextValue {
  workflow: WorkflowPayload;
  isLoading: boolean;
  reload: () => Promise<void>;
  getStatusLabel: (status: TicketStatus) => string;
  getStatusLabels: () => Record<TicketStatus, string>;
  getStatusBadgeVariant: (status: TicketStatus) => WorkflowBadgeVariant;
  getAllowedTransitions: (from: TicketStatus) => TicketStatus[];
  isNoteRequiredForTransition: (from: TicketStatus, to: TicketStatus) => boolean;
  getKanbanColumns: () => TicketStatus[];
  isFinalizedStatus: (status: TicketStatus) => boolean;
  listStatuses: () => TicketStatus[];
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [workflow, setWorkflow] = useState<WorkflowPayload>(FALLBACK_WORKFLOW);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!token) {
      setWorkflow(FALLBACK_WORKFLOW);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get<{ data: WorkflowPayload }>('/workflow', token);
      if (res.data) setWorkflow(res.data);
    } catch {
      /* mantener valor actual / fallback */
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<WorkflowContextValue>(
    () => ({
      workflow,
      isLoading,
      reload,
      getStatusLabel: (status) => getStatusLabel(workflow, status),
      getStatusLabels: () => getStatusLabels(workflow),
      getStatusBadgeVariant: (status) =>
        getStatusBadgeVariant(workflow, status),
      getAllowedTransitions: (from) => getAllowedTransitions(workflow, from),
      isNoteRequiredForTransition: (from, to) =>
        isNoteRequiredForTransition(workflow, from, to),
      getKanbanColumns: () => getKanbanColumns(workflow),
      isFinalizedStatus: (status) => isFinalizedStatus(workflow, status),
      listStatuses: () => listStatuses(workflow),
    }),
    [workflow, isLoading, reload],
  );

  return (
    <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
  );
}

/**
 * Accede al workflow cargado (o al fallback estático si aún no hay token/API).
 */
export function useWorkflow(): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    return {
      workflow: FALLBACK_WORKFLOW,
      isLoading: false,
      reload: async () => {},
      getStatusLabel: (status) => getStatusLabel(FALLBACK_WORKFLOW, status),
      getStatusLabels: () => getStatusLabels(FALLBACK_WORKFLOW),
      getStatusBadgeVariant: (status) =>
        getStatusBadgeVariant(FALLBACK_WORKFLOW, status),
      getAllowedTransitions: (from) =>
        getAllowedTransitions(FALLBACK_WORKFLOW, from),
      isNoteRequiredForTransition: (from, to) =>
        isNoteRequiredForTransition(FALLBACK_WORKFLOW, from, to),
      getKanbanColumns: () => getKanbanColumns(FALLBACK_WORKFLOW),
      isFinalizedStatus: (status) =>
        isFinalizedStatus(FALLBACK_WORKFLOW, status),
      listStatuses: () => listStatuses(FALLBACK_WORKFLOW),
    };
  }
  return ctx;
}
