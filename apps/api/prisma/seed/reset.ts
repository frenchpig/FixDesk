// Responsabilidad: vaciar datos mutables antes de resembrar la demo
// Usado por: prisma/seed.ts
// NO hace: recrear catálogos ni tickets

import type { PrismaClient } from '@prisma/client';

/**
 * Borra notificaciones, historial, tickets, usuarios, labels y estados
 * de workflow para dejar la DB lista para el seed demo.
 * Áreas y SystemSettings se restauran vía upsert en catalog.
 */
export async function resetDemoDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.notification.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.label.deleteMany();
  await prisma.workflowState.deleteMany();

  console.log('  datos previos eliminados (demo reset)');
}
