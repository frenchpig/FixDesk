// Responsabilidad: helpers puros sobre el payload de workflow (labels, transiciones, notas)
// Usado por: workflow-context, StatusBadge, TicketActions, KanbanBoard, filtros
// NO hace: fetch HTTP ni estado React
import type {
  TicketStatus,
  WorkflowBadgeVariant,
  WorkflowPayload,
  WorkflowState,
} from '@/types';

/**
 * Fallback estático para evitar flash vacío antes de que llegue GET /workflow.
 */
export const FALLBACK_WORKFLOW: WorkflowPayload = {
  states: [
    {
      id: 'OPEN',
      label: 'Abierto',
      finalized: false,
      kanban: true,
      badgeVariant: 'default',
    },
    {
      id: 'IN_PROGRESS',
      label: 'En progreso',
      finalized: false,
      kanban: true,
      badgeVariant: 'primary',
    },
    {
      id: 'PENDING',
      label: 'Pendiente',
      finalized: false,
      kanban: true,
      badgeVariant: 'warning',
    },
    {
      id: 'RESOLVED',
      label: 'Resuelto',
      finalized: true,
      kanban: true,
      badgeVariant: 'success',
    },
    {
      id: 'CANCELLED',
      label: 'Cancelado',
      finalized: true,
      kanban: false,
      badgeVariant: 'danger',
    },
  ],
  transitions: {
    OPEN: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
    IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
    PENDING: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    RESOLVED: ['OPEN'],
    CANCELLED: ['OPEN'],
  },
  noteRequired: {
    entering: ['PENDING', 'CANCELLED'],
    leavingFinalized: true,
  },
};

function stateMap(workflow: WorkflowPayload): Map<TicketStatus, WorkflowState> {
  return new Map(workflow.states.map((s) => [s.id, s]));
}

export function getStatusLabel(
  workflow: WorkflowPayload,
  status: TicketStatus,
): string {
  return stateMap(workflow).get(status)?.label ?? status;
}

export function getStatusLabels(
  workflow: WorkflowPayload,
): Record<TicketStatus, string> {
  const labels = {} as Record<TicketStatus, string>;
  for (const state of workflow.states) {
    labels[state.id] = state.label;
  }
  return labels;
}

export function getStatusBadgeVariant(
  workflow: WorkflowPayload,
  status: TicketStatus,
): WorkflowBadgeVariant {
  return stateMap(workflow).get(status)?.badgeVariant ?? 'default';
}

export function getAllowedTransitions(
  workflow: WorkflowPayload,
  from: TicketStatus,
): TicketStatus[] {
  return workflow.transitions[from] ?? [];
}

export function isNoteRequiredForTransition(
  workflow: WorkflowPayload,
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  if (workflow.noteRequired.entering.includes(to)) return true;
  if (!workflow.noteRequired.leavingFinalized) return false;
  const fromState = stateMap(workflow).get(from);
  return fromState?.finalized === true;
}

export function getKanbanColumns(workflow: WorkflowPayload): TicketStatus[] {
  return workflow.states.filter((s) => s.kanban).map((s) => s.id);
}

export function isFinalizedStatus(
  workflow: WorkflowPayload,
  status: TicketStatus,
): boolean {
  return stateMap(workflow).get(status)?.finalized === true;
}

export function listStatuses(workflow: WorkflowPayload): TicketStatus[] {
  return workflow.states.map((s) => s.id);
}
