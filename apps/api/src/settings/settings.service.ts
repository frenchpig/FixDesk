// Responsabilidad: leer y persistir configuración global (SLA)
// Usado por: SettingsController, ReportsService
// NO hace: calcular métricas de cumplimiento ni UI

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSlaTargetHoursFromEnv } from '../config/sla.config';

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
}
