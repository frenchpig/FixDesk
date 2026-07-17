import { TicketStatus } from '@prisma/client';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

export interface WorkflowStateDef {
  id: TicketStatus;
  label: string;
  finalized: boolean;
  kanban: boolean;
  badgeVariant: BadgeVariant;
}

export interface WorkflowNoteRequiredDef {
  entering: TicketStatus[];
  leavingFinalized: boolean;
}

export interface WorkflowDefinition {
  states: WorkflowStateDef[];
  transitions: Record<TicketStatus, TicketStatus[]>;
  noteRequired: WorkflowNoteRequiredDef;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelto',
  CANCELLED: 'Cancelado',
};

export const STATUS_BADGE_VARIANTS: Record<TicketStatus, BadgeVariant> = {
  OPEN: 'default',
  IN_PROGRESS: 'primary',
  PENDING: 'warning',
  RESOLVED: 'success',
  CANCELLED: 'danger',
};

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
  PENDING: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['OPEN'],
  CANCELLED: ['OPEN'],
};

export const FINALIZED_STATUSES: TicketStatus[] = [
  TicketStatus.RESOLVED,
  TicketStatus.CANCELLED,
];

/** Columnas visibles en el tablero kanban (excluye CANCELLED). */
export const KANBAN_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.PENDING,
  TicketStatus.RESOLVED,
];

/** Estados que requieren nota al entrar. */
export const NOTE_REQUIRED_ENTERING: TicketStatus[] = [
  TicketStatus.PENDING,
  TicketStatus.CANCELLED,
];

export const ALL_TICKET_STATUSES = Object.values(
  TicketStatus,
) as TicketStatus[];

const BADGE_VARIANTS: BadgeVariant[] = [
  'default',
  'primary',
  'success',
  'warning',
  'danger',
];

/**
 * Definición por defecto del workflow (enum fijo de 5 estados).
 */
export function buildDefaultWorkflow(): WorkflowDefinition {
  return {
    states: ALL_TICKET_STATUSES.map((id) => ({
      id,
      label: STATUS_LABELS[id],
      finalized: FINALIZED_STATUSES.includes(id),
      kanban: KANBAN_STATUSES.includes(id),
      badgeVariant: STATUS_BADGE_VARIANTS[id],
    })),
    transitions: {
      OPEN: [...ALLOWED_TRANSITIONS.OPEN],
      IN_PROGRESS: [...ALLOWED_TRANSITIONS.IN_PROGRESS],
      PENDING: [...ALLOWED_TRANSITIONS.PENDING],
      RESOLVED: [...ALLOWED_TRANSITIONS.RESOLVED],
      CANCELLED: [...ALLOWED_TRANSITIONS.CANCELLED],
    },
    noteRequired: {
      entering: [...NOTE_REQUIRED_ENTERING],
      leavingFinalized: true,
    },
  };
}

/**
 * Nota obligatoria según la definición de workflow dada.
 */
export function isNoteRequiredForTransitionIn(
  workflow: WorkflowDefinition,
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  if (workflow.noteRequired.entering.includes(to)) return true;
  if (!workflow.noteRequired.leavingFinalized) return false;
  const fromState = workflow.states.find((s) => s.id === from);
  return fromState?.finalized === true;
}

/**
 * @deprecated Preferir isNoteRequiredForTransitionIn con workflow resuelto.
 */
export function isNoteRequiredForTransition(
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  return isNoteRequiredForTransitionIn(buildDefaultWorkflow(), from, to);
}

/**
 * Valida y normaliza un payload de workflow. Lanza Error con mensaje usable.
 */
export function assertValidWorkflowConfig(raw: unknown): WorkflowDefinition {
  if (!raw || typeof raw !== 'object') {
    throw new Error('workflowConfig debe ser un objeto');
  }

  const input = raw as Partial<WorkflowDefinition>;
  if (!Array.isArray(input.states) || input.states.length !== 5) {
    throw new Error('Debe haber exactamente 5 estados');
  }

  const seen = new Set<string>();
  const states: WorkflowStateDef[] = [];

  for (const state of input.states) {
    if (!state || typeof state !== 'object') {
      throw new Error('Estado inválido');
    }
    if (!ALL_TICKET_STATUSES.includes(state.id as TicketStatus)) {
      throw new Error(`Estado desconocido: ${String(state.id)}`);
    }
    if (seen.has(state.id)) {
      throw new Error(`Estado duplicado: ${state.id}`);
    }
    seen.add(state.id);

    const label = typeof state.label === 'string' ? state.label.trim() : '';
    if (!label) {
      throw new Error(`El label de ${state.id} no puede estar vacío`);
    }

    if (!BADGE_VARIANTS.includes(state.badgeVariant as BadgeVariant)) {
      throw new Error(`badgeVariant inválido para ${state.id}`);
    }

    states.push({
      id: state.id as TicketStatus,
      label,
      finalized: Boolean(state.finalized),
      kanban: Boolean(state.kanban),
      badgeVariant: state.badgeVariant as BadgeVariant,
    });
  }

  for (const id of ALL_TICKET_STATUSES) {
    if (!seen.has(id)) {
      throw new Error(`Falta el estado obligatorio: ${id}`);
    }
  }

  if (!states.some((s) => s.kanban)) {
    throw new Error('Debe haber al menos un estado visible en kanban');
  }

  if (!input.transitions || typeof input.transitions !== 'object') {
    throw new Error('transitions es obligatorio');
  }

  const transitions = {} as Record<TicketStatus, TicketStatus[]>;
  for (const id of ALL_TICKET_STATUSES) {
    const targets = (input.transitions as Record<string, unknown>)[id];
    if (!Array.isArray(targets)) {
      throw new Error(`Faltan transiciones para ${id}`);
    }
    const unique = [...new Set(targets)];
    for (const target of unique) {
      if (!ALL_TICKET_STATUSES.includes(target as TicketStatus)) {
        throw new Error(`Transición inválida ${id} → ${String(target)}`);
      }
    }
    transitions[id] = unique as TicketStatus[];
  }

  const note = input.noteRequired;
  if (!note || typeof note !== 'object') {
    throw new Error('noteRequired es obligatorio');
  }
  if (!Array.isArray(note.entering)) {
    throw new Error('noteRequired.entering debe ser un arreglo');
  }
  for (const status of note.entering) {
    if (!ALL_TICKET_STATUSES.includes(status as TicketStatus)) {
      throw new Error(`noteRequired.entering inválido: ${String(status)}`);
    }
  }

  return {
    states,
    transitions,
    noteRequired: {
      entering: [...new Set(note.entering)] as TicketStatus[],
      leavingFinalized: Boolean(note.leavingFinalized),
    },
  };
}

/**
 * Si raw es null/undefined o inválido, retorna defaults.
 * Si es válido, retorna la definición normalizada.
 */
export function resolveWorkflowConfig(raw: unknown): WorkflowDefinition {
  if (raw == null) return buildDefaultWorkflow();
  try {
    return assertValidWorkflowConfig(raw);
  } catch {
    return buildDefaultWorkflow();
  }
}

export const CATEGORY_AREA_MAP: Record<string, string> = {
  HARDWARE: 'Hardware y equipos',
  NETWORK: 'Redes y conectividad',
  INFRASTRUCTURE: 'Infraestructura física',
  ELECTRICAL: 'Instalaciones eléctricas',
};
