// Responsabilidad: sembrar áreas, etiquetas, SLA y estados de workflow
// Usado por: prisma/seed.ts
// NO hace: usuarios ni tickets

import type { PrismaClient } from '@prisma/client';
import { DEFAULT_WORKFLOW_STATES } from '../../src/tickets/ticket-transitions';

const AREAS = [
  { name: 'Hardware y equipos', description: 'Proyectores, PCs, periféricos' },
  { name: 'Redes y conectividad', description: 'WiFi, switches, cableado' },
  {
    name: 'Infraestructura física',
    description: 'Mobiliario, bicicleteros, señalética',
  },
  {
    name: 'Instalaciones eléctricas',
    description: 'Iluminación, tomas, tableros',
  },
] as const;

const LABELS = [
  { name: 'Urgente', color: '#EF4444' },
  { name: 'Recurrente', color: '#F59E0B' },
  { name: 'Campus', color: '#3B82F6' },
  { name: 'Aula', color: '#8B5CF6' },
  { name: 'Exterior', color: '#10B981' },
] as const;

export type AreaNameMap = Record<string, string>;
export type LabelNameMap = Record<string, string>;

export interface CatalogSeedResult {
  areaByName: AreaNameMap;
  labelByName: LabelNameMap;
  slaTargetHours: number;
}

/**
 * Upsert de catálogos idempotentes (áreas, labels, settings, workflow).
 */
export async function seedCatalog(
  prisma: PrismaClient,
): Promise<CatalogSeedResult> {
  for (const area of AREAS) {
    await prisma.area.upsert({
      where: { name: area.name },
      update: { description: area.description },
      create: { name: area.name, description: area.description },
    });
  }

  const areas = await prisma.area.findMany({
    select: { id: true, name: true },
  });
  const areaByName: AreaNameMap = Object.fromEntries(
    areas.map((a) => [a.name, a.id]),
  );

  for (const label of LABELS) {
    await prisma.label.upsert({
      where: { name: label.name },
      update: { color: label.color },
      create: { name: label.name, color: label.color },
    });
  }

  const labels = await prisma.label.findMany({
    select: { id: true, name: true },
  });
  const labelByName: LabelNameMap = Object.fromEntries(
    labels.map((l) => [l.name, l.id]),
  );

  const slaFromEnv = Number.parseInt(process.env.SLA_TARGET_HOURS ?? '', 10);
  const slaTargetHours =
    Number.isFinite(slaFromEnv) && slaFromEnv > 0 ? slaFromEnv : 48;

  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {
      slaTargetHours,
      workflowNoteOnReopen: true,
      updatedById: null,
    },
    create: {
      id: 'default',
      slaTargetHours,
    },
  });

  for (const state of DEFAULT_WORKFLOW_STATES) {
    await prisma.workflowState.upsert({
      where: { key: state.key },
      update: state,
      create: state,
    });
  }

  console.log(`  ${AREAS.length} áreas`);
  console.log(`  ${LABELS.length} etiquetas`);
  console.log(`  SLA objetivo: ${slaTargetHours}h`);
  console.log(`  ${DEFAULT_WORKFLOW_STATES.length} estados de workflow`);

  return { areaByName, labelByName, slaTargetHours };
}
