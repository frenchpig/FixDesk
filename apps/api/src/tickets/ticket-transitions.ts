import { TicketStatus } from '@prisma/client';

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
  PENDING: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['OPEN'],
  CANCELLED: ['OPEN'],
};

const FINALIZED_STATUSES: TicketStatus[] = [
  TicketStatus.RESOLVED,
  TicketStatus.CANCELLED,
];

/**
 * Nota obligatoria al entrar a PENDING/CANCELLED
 * o al salir de un estado finalizado (RESOLVED / CANCELLED).
 */
export function isNoteRequiredForTransition(
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  if (to === TicketStatus.PENDING || to === TicketStatus.CANCELLED) {
    return true;
  }
  return FINALIZED_STATUSES.includes(from);
}

export const CATEGORY_AREA_MAP: Record<string, string> = {
  HARDWARE: 'Hardware y equipos',
  NETWORK: 'Redes y conectividad',
  INFRASTRUCTURE: 'Infraestructura física',
  ELECTRICAL: 'Instalaciones eléctricas',
};
