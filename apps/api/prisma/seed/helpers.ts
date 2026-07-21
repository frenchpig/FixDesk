// Responsabilidad: utilidades de fechas y hash compartidas por los seeders
// Usado por: prisma/seed/*.ts
// NO hace: acceso a Prisma ni lógica de dominio

import * as bcrypt from 'bcrypt';

export const DEMO_PASSWORD = 'fixdesk123';

/**
 * Fecha relativa a ahora, restando días (y opcionalmente horas).
 */
export function daysAgo(days: number, hours = 0): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(d.getUTCHours() - hours, 0, 0, 0);
  return d;
}

/**
 * Fecha posterior a `base` sumando horas.
 */
export function hoursAfter(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 3_600_000);
}

export async function hashDemoPassword(): Promise<string> {
  return bcrypt.hash(DEMO_PASSWORD, 10);
}
