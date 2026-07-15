import type {
  TicketCategory,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
} from '@/types';

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardware',
  NETWORK: 'Redes',
  INFRASTRUCTURE: 'Infraestructura',
  ELECTRICAL: 'Eléctrico',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelto',
  CANCELLED: 'Cancelado',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

/** Impacto / alcance del incidente (distinto de prioridad). */
export const SEVERITY_LABELS: Record<TicketSeverity, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

/** Espejo de apps/api/src/tickets/ticket-transitions.ts */
export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
  PENDING: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['OPEN'],
  CANCELLED: ['OPEN'],
};

const FINALIZED_STATUSES: TicketStatus[] = ['RESOLVED', 'CANCELLED'];

export function isNoteRequiredForTransition(
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  if (to === 'PENDING' || to === 'CANCELLED') return true;
  return FINALIZED_STATUSES.includes(from);
}

export const KANBAN_COLUMNS: TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'PENDING',
  'RESOLVED',
];
