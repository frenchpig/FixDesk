// Responsabilidad: leer y persistir configuración global (SLA + workflow)
// Usado por: SettingsController, ReportsService
// NO hace: calcular métricas de cumplimiento ni UI

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSlaTargetHoursFromEnv } from '../config/sla.config';
import type {
  CreateWorkflowStateDto,
  UpdateWorkflowDto,
  UpdateWorkflowStateDto,
} from './dto/update-workflow.dto';

const SETTINGS_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Resuelve el umbral SLA: DB → env → 48.
   */
  async getSlaTargetHours(): Promise<number> {
    const row = await this.prisma.systemSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: { slaTargetHours: true },
    });

    if (row && row.slaTargetHours > 0) {
      return row.slaTargetHours;
    }

    return resolveSlaTargetHoursFromEnv(this.config);
  }

  async getSlaSettings() {
    const slaTargetHours = await this.getSlaTargetHours();
    const row = await this.prisma.systemSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: { updatedAt: true, updatedById: true },
    });

    return {
      data: {
        slaTargetHours,
        updatedAt: row?.updatedAt?.toISOString() ?? null,
        updatedById: row?.updatedById ?? null,
      },
    };
  }

  /**
   * Actualiza el umbral SLA (solo ADMIN). Valida 1–720.
   */
  async updateSlaTargetHours(hours: number, userId: string) {
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
      throw new BadRequestException(
        'slaTargetHours debe ser un entero entre 1 y 720',
      );
    }

    const row = await this.prisma.systemSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        slaTargetHours: hours,
        updatedById: userId,
      },
      update: {
        slaTargetHours: hours,
        updatedById: userId,
      },
      select: {
        slaTargetHours: true,
        updatedAt: true,
        updatedById: true,
      },
    });

    return {
      data: {
        slaTargetHours: row.slaTargetHours,
        updatedAt: row.updatedAt.toISOString(),
        updatedById: row.updatedById,
      },
    };
  }

  /**
   * Lista todos los estados del workflow (activos e inactivos, por orden)
   * más el flag global de nota al reabrir.
   */
  async getWorkflowSettings() {
    const [states, settings] = await Promise.all([
      this.prisma.workflowState.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.systemSettings.findUnique({
        where: { id: SETTINGS_ID },
        select: {
          workflowNoteOnReopen: true,
          updatedAt: true,
          updatedById: true,
        },
      }),
    ]);

    return {
      data: {
        states,
        workflowNoteOnReopen: settings?.workflowNoteOnReopen ?? true,
        updatedAt: settings?.updatedAt?.toISOString() ?? null,
        updatedById: settings?.updatedById ?? null,
      },
    };
  }

  /**
   * Crea un estado nuevo. La key se genera como slug único del label.
   * @throws {BadRequestException} Si la key generada ya existe.
   */
  async createWorkflowState(dto: CreateWorkflowStateDto) {
    const key = this.slugifyKey(dto.label);
    if (!key) {
      throw new BadRequestException('El label no genera una key válida');
    }

    const existing = await this.prisma.workflowState.findUnique({
      where: { key },
    });
    if (existing) {
      throw new BadRequestException(
        `Ya existe un estado con la key ${key} (label demasiado similar)`,
      );
    }

    if (dto.allowedTargets?.length) {
      await this.assertTargetsExist(dto.allowedTargets);
    }

    const maxOrder = await this.prisma.workflowState.aggregate({
      _max: { order: true },
    });

    const state = await this.prisma.workflowState.create({
      data: {
        key,
        label: dto.label.trim(),
        semantic: dto.semantic,
        badgeVariant: dto.badgeVariant ?? 'default',
        kanban: dto.kanban ?? true,
        finalized: dto.finalized ?? false,
        noteRequiredOnEnter: dto.noteRequiredOnEnter ?? false,
        allowedTargets: [...new Set(dto.allowedTargets ?? [])],
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return { data: state };
  }

  /**
   * Edita un estado existente (label, badge, flags, transiciones, orden, semantic).
   * @throws {NotFoundException} Si la key no existe.
   * @throws {BadRequestException} Si la edición rompe invariantes (kanban vacío, targets inexistentes).
   */
  async updateWorkflowState(key: string, dto: UpdateWorkflowStateDto) {
    const state = await this.prisma.workflowState.findUnique({
      where: { key },
    });
    if (!state) {
      throw new NotFoundException(`Estado no encontrado: ${key}`);
    }

    if (dto.allowedTargets) {
      await this.assertTargetsExist(
        dto.allowedTargets.filter((t) => t !== key),
      );
    }

    const willBeActive = dto.isActive ?? state.isActive;
    const willBeKanban = dto.kanban ?? state.kanban;
    if (
      (state.isActive && state.kanban && (!willBeActive || !willBeKanban)) ||
      (!state.kanban && dto.kanban === false)
    ) {
      await this.assertKanbanNotEmptied(key);
    }

    if (dto.isActive === false && state.isDefault) {
      throw new BadRequestException(
        'No se puede desactivar el estado default; asigna otro default primero',
      );
    }

    const updated = await this.prisma.workflowState.update({
      where: { key },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.semantic !== undefined ? { semantic: dto.semantic } : {}),
        ...(dto.badgeVariant !== undefined
          ? { badgeVariant: dto.badgeVariant }
          : {}),
        ...(dto.kanban !== undefined ? { kanban: dto.kanban } : {}),
        ...(dto.finalized !== undefined ? { finalized: dto.finalized } : {}),
        ...(dto.noteRequiredOnEnter !== undefined
          ? { noteRequiredOnEnter: dto.noteRequiredOnEnter }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.allowedTargets !== undefined
          ? {
              allowedTargets: [
                ...new Set(dto.allowedTargets.filter((t) => t !== key)),
              ],
            }
          : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });

    return { data: updated };
  }

  /**
   * Elimina (o desactiva si tiene tickets) un estado.
   * @throws {BadRequestException} Si es el default o dejaría el kanban vacío.
   */
  async deleteWorkflowState(key: string) {
    const state = await this.prisma.workflowState.findUnique({
      where: { key },
    });
    if (!state) {
      throw new NotFoundException(`Estado no encontrado: ${key}`);
    }

    if (state.isDefault) {
      throw new BadRequestException(
        'No se puede eliminar el estado default; asigna otro default primero',
      );
    }

    if (state.isActive && state.kanban) {
      await this.assertKanbanNotEmptied(key);
    }

    const ticketCount = await this.prisma.ticket.count({
      where: { status: key },
    });

    if (ticketCount > 0) {
      const updated = await this.prisma.workflowState.update({
        where: { key },
        data: { isActive: false },
      });
      return { data: updated, deactivated: true };
    }

    await this.prisma.$transaction([
      this.prisma.workflowState.delete({ where: { key } }),
      ...(await this.buildRemoveTargetUpdates(key)),
    ]);

    return { data: null, deleted: true };
  }

  /**
   * Ajustes globales del workflow: nota al reabrir y estado default.
   * @throws {BadRequestException} Si defaultStateKey no es un estado activo.
   */
  async updateWorkflowGlobal(dto: UpdateWorkflowDto, userId: string) {
    if (dto.defaultStateKey !== undefined) {
      const state = await this.prisma.workflowState.findUnique({
        where: { key: dto.defaultStateKey },
      });
      if (!state || !state.isActive) {
        throw new BadRequestException(
          'El estado default debe existir y estar activo',
        );
      }

      await this.prisma.$transaction([
        this.prisma.workflowState.updateMany({
          where: { isDefault: true, NOT: { key: dto.defaultStateKey } },
          data: { isDefault: false },
        }),
        this.prisma.workflowState.update({
          where: { key: dto.defaultStateKey },
          data: { isDefault: true },
        }),
      ]);
    }

    if (dto.workflowNoteOnReopen !== undefined) {
      await this.prisma.systemSettings.upsert({
        where: { id: SETTINGS_ID },
        create: {
          id: SETTINGS_ID,
          workflowNoteOnReopen: dto.workflowNoteOnReopen,
          updatedById: userId,
        },
        update: {
          workflowNoteOnReopen: dto.workflowNoteOnReopen,
          updatedById: userId,
        },
      });
    }

    return this.getWorkflowSettings();
  }

  /** Genera una key tipo EN_REVISION a partir del label. */
  private slugifyKey(label: string): string {
    return label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase()
      .slice(0, 40);
  }

  private async assertTargetsExist(targets: string[]) {
    const unique = [...new Set(targets)];
    if (!unique.length) return;
    const found = await this.prisma.workflowState.count({
      where: { key: { in: unique } },
    });
    if (found !== unique.length) {
      throw new BadRequestException(
        'allowedTargets contiene keys de estados inexistentes',
      );
    }
  }

  /** Falla si al excluir `key` no queda ningún estado activo visible en kanban. */
  private async assertKanbanNotEmptied(key: string) {
    const remaining = await this.prisma.workflowState.count({
      where: { isActive: true, kanban: true, NOT: { key } },
    });
    if (remaining === 0) {
      throw new BadRequestException(
        'El kanban debe conservar al menos una columna activa',
      );
    }
  }

  /** Updates que quitan `key` de los allowedTargets de los demás estados. */
  private async buildRemoveTargetUpdates(key: string) {
    const referencing = await this.prisma.workflowState.findMany({
      where: { allowedTargets: { has: key } },
      select: { key: true, allowedTargets: true },
    });
    return referencing.map((s) =>
      this.prisma.workflowState.update({
        where: { key: s.key },
        data: { allowedTargets: s.allowedTargets.filter((t) => t !== key) },
      }),
    );
  }
}
