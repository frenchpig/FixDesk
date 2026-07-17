// Responsabilidad: resolver y exponer la definición de workflow desde la tabla WorkflowState
// Usado por: WorkflowController, TicketsService, ReportsService
// NO hace: CRUD de estados (eso es SettingsService)
import { Injectable } from '@nestjs/common';
import { StatusSemantic } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_WORKFLOW_STATES } from '../tickets/ticket-transitions';

const SETTINGS_ID = 'default';

export interface ResolvedWorkflowState {
  id: string;
  label: string;
  badgeVariant: string;
  semantic: StatusSemantic;
  finalized: boolean;
  kanban: boolean;
  noteRequiredOnEnter: boolean;
  isDefault: boolean;
  order: number;
}

export interface ResolvedWorkflow {
  states: ResolvedWorkflowState[];
  transitions: Record<string, string[]>;
  noteRequired: {
    entering: string[];
    leavingFinalized: boolean;
  };
}

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Arma el workflow desde WorkflowState (activos, por orden) +
   * workflowNoteOnReopen. Fallback a defaults de código si la tabla está vacía.
   */
  async getResolvedWorkflow(): Promise<ResolvedWorkflow> {
    const [rows, settings] = await Promise.all([
      this.prisma.workflowState.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.systemSettings.findUnique({
        where: { id: SETTINGS_ID },
        select: { workflowNoteOnReopen: true },
      }),
    ]);

    const source = rows.length > 0 ? rows : DEFAULT_WORKFLOW_STATES;
    const activeKeys = new Set(source.map((s) => s.key));
    const leavingFinalized = settings?.workflowNoteOnReopen ?? true;

    return {
      states: source.map((s, i) => ({
        id: s.key,
        label: s.label,
        badgeVariant: s.badgeVariant,
        semantic: s.semantic,
        finalized: s.finalized,
        kanban: s.kanban,
        noteRequiredOnEnter: s.noteRequiredOnEnter,
        isDefault: s.isDefault,
        order: 'order' in s ? s.order : i,
      })),
      transitions: Object.fromEntries(
        source.map((s) => [
          s.key,
          s.allowedTargets.filter((t) => activeKeys.has(t)),
        ]),
      ),
      noteRequired: {
        entering: source.filter((s) => s.noteRequiredOnEnter).map((s) => s.key),
        leavingFinalized,
      },
    };
  }

  async getWorkflow() {
    const data = await this.getResolvedWorkflow();
    return { data };
  }

  getStatusLabel(workflow: ResolvedWorkflow, status: string): string {
    return workflow.states.find((s) => s.id === status)?.label ?? status;
  }

  isTransitionAllowed(
    workflow: ResolvedWorkflow,
    from: string,
    to: string,
  ): boolean {
    return (workflow.transitions[from] ?? []).includes(to);
  }

  isNoteRequired(
    workflow: ResolvedWorkflow,
    from: string,
    to: string,
  ): boolean {
    if (workflow.noteRequired.entering.includes(to)) return true;
    if (!workflow.noteRequired.leavingFinalized) return false;
    const fromState = workflow.states.find((s) => s.id === from);
    return fromState?.finalized === true;
  }

  /** Key del estado inicial para tickets nuevos (isDefault, fallback "OPEN"). */
  getDefaultStateKey(workflow: ResolvedWorkflow): string {
    return (
      workflow.states.find((s) => s.isDefault)?.id ??
      workflow.states[0]?.id ??
      'OPEN'
    );
  }

  /** Keys de estados con la semántica dada. */
  getKeysBySemantic(
    workflow: ResolvedWorkflow,
    semantic: StatusSemantic,
  ): string[] {
    return workflow.states
      .filter((s) => s.semantic === semantic)
      .map((s) => s.id);
  }

  /** Map key → label de todos los estados activos. */
  getStatusLabels(workflow: ResolvedWorkflow): Record<string, string> {
    return Object.fromEntries(workflow.states.map((s) => [s.id, s.label]));
  }

  /**
   * Map key → label incluyendo estados inactivos (para historial y reportes,
   * donde pueden aparecer keys ya desactivadas).
   */
  async getAllStatusLabels(): Promise<Record<string, string>> {
    const rows = await this.prisma.workflowState.findMany({
      select: { key: true, label: true },
    });
    const source = rows.length > 0 ? rows : DEFAULT_WORKFLOW_STATES;
    return Object.fromEntries(source.map((s) => [s.key, s.label]));
  }

  /**
   * Estados para reportería: incluye inactivos, porque tickets existentes
   * pueden seguir en una key desactivada y no deben salir de las métricas.
   */
  async getReportingStates(): Promise<
    { key: string; semantic: StatusSemantic; finalized: boolean }[]
  > {
    const rows = await this.prisma.workflowState.findMany({
      select: { key: true, semantic: true, finalized: true },
    });
    return rows.length > 0
      ? rows
      : DEFAULT_WORKFLOW_STATES.map((s) => ({
          key: s.key,
          semantic: s.semantic,
          finalized: s.finalized,
        }));
  }
}
