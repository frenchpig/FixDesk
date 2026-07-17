// Responsabilidad: defaults de seed del workflow (5 estados clásicos) y mapa categoría→área
// Usado por: prisma/seed.ts, WorkflowService (fallback), TicketsService (áreas)
// NO hace: resolver el workflow en runtime (eso es WorkflowService desde DB)

import { StatusSemantic } from '@prisma/client';

export type BadgeVariant =
  'default' | 'primary' | 'success' | 'warning' | 'danger';

export const BADGE_VARIANTS: BadgeVariant[] = [
  'default',
  'primary',
  'success',
  'warning',
  'danger',
];

/** Forma de un estado default (espejo de la tabla WorkflowState, sin id). */
export interface DefaultWorkflowState {
  key: string;
  label: string;
  badgeVariant: BadgeVariant;
  semantic: StatusSemantic;
  finalized: boolean;
  kanban: boolean;
  noteRequiredOnEnter: boolean;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  allowedTargets: string[];
}

/**
 * Los 5 estados clásicos del workflow. Se usan para el seed inicial
 * y como fallback si la tabla WorkflowState está vacía.
 */
export const DEFAULT_WORKFLOW_STATES: DefaultWorkflowState[] = [
  {
    key: 'OPEN',
    label: 'Abierto',
    badgeVariant: 'default',
    semantic: StatusSemantic.OPEN,
    finalized: false,
    kanban: true,
    noteRequiredOnEnter: false,
    isDefault: true,
    isActive: true,
    order: 0,
    allowedTargets: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  },
  {
    key: 'IN_PROGRESS',
    label: 'En progreso',
    badgeVariant: 'primary',
    semantic: StatusSemantic.IN_PROGRESS,
    finalized: false,
    kanban: true,
    noteRequiredOnEnter: false,
    isDefault: false,
    isActive: true,
    order: 1,
    allowedTargets: ['PENDING', 'RESOLVED', 'OPEN'],
  },
  {
    key: 'PENDING',
    label: 'Pendiente',
    badgeVariant: 'warning',
    semantic: StatusSemantic.PENDING,
    finalized: false,
    kanban: true,
    noteRequiredOnEnter: true,
    isDefault: false,
    isActive: true,
    order: 2,
    allowedTargets: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  },
  {
    key: 'RESOLVED',
    label: 'Resuelto',
    badgeVariant: 'success',
    semantic: StatusSemantic.RESOLVED,
    finalized: true,
    kanban: true,
    noteRequiredOnEnter: false,
    isDefault: false,
    isActive: true,
    order: 3,
    allowedTargets: ['OPEN'],
  },
  {
    key: 'CANCELLED',
    label: 'Cancelado',
    badgeVariant: 'danger',
    semantic: StatusSemantic.CANCELLED,
    finalized: true,
    kanban: false,
    noteRequiredOnEnter: true,
    isDefault: false,
    isActive: true,
    order: 4,
    allowedTargets: ['OPEN'],
  },
];

export const CATEGORY_AREA_MAP: Record<string, string> = {
  HARDWARE: 'Hardware y equipos',
  NETWORK: 'Redes y conectividad',
  INFRASTRUCTURE: 'Infraestructura física',
  ELECTRICAL: 'Instalaciones eléctricas',
};
