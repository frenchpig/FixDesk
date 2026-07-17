import type {
  TicketCategory,
  TicketPriority,
  TicketSeverity,
} from '@/types';

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardware',
  NETWORK: 'Redes',
  INFRASTRUCTURE: 'Infraestructura',
  ELECTRICAL: 'Eléctrico',
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
