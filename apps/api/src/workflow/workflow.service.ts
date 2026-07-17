// Responsabilidad: resolver y exponer la definición de workflow (DB o defaults)
// Usado por: WorkflowController, TicketsService
// NO hace: persistir settings (eso es SettingsService)
import { Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  isNoteRequiredForTransitionIn,
  resolveWorkflowConfig,
  type WorkflowDefinition,
} from '../tickets/ticket-transitions';

const SETTINGS_ID = 'default';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lee SystemSettings.workflowConfig y cae a defaults de código si es null/inválido.
   */
  async getResolvedWorkflow(): Promise<WorkflowDefinition> {
    const row = await this.prisma.systemSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: { workflowConfig: true },
    });
    return resolveWorkflowConfig(row?.workflowConfig);
  }

  async getWorkflow() {
    const data = await this.getResolvedWorkflow();
    return { data };
  }

  getStatusLabel(workflow: WorkflowDefinition, status: TicketStatus): string {
    return workflow.states.find((s) => s.id === status)?.label ?? status;
  }

  isTransitionAllowed(
    workflow: WorkflowDefinition,
    from: TicketStatus,
    to: TicketStatus,
  ): boolean {
    return (workflow.transitions[from] ?? []).includes(to);
  }

  isNoteRequired(
    workflow: WorkflowDefinition,
    from: TicketStatus,
    to: TicketStatus,
  ): boolean {
    return isNoteRequiredForTransitionIn(workflow, from, to);
  }
}
