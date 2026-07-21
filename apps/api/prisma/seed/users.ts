// Responsabilidad: sembrar usuarios demo (roles + técnicos por área)
// Usado por: prisma/seed.ts
// NO hace: tickets ni catálogos

import { Role, type PrismaClient } from '@prisma/client';
import { hashDemoPassword } from './helpers';
import type { AreaNameMap } from './catalog';

export type UserEmailMap = Record<string, string>;

export interface UsersSeedResult {
  userByEmail: UserEmailMap;
}

interface UserDef {
  email: string;
  name: string;
  role: Role;
  areaName?: string;
}

const USER_DEFS: UserDef[] = [
  {
    email: 'tecnico@fixdesk.dev',
    name: 'Juan Técnico',
    role: Role.TECHNICIAN,
    areaName: 'Hardware y equipos',
  },
  {
    email: 'tecnico.redes@fixdesk.dev',
    name: 'Laura Redes',
    role: Role.TECHNICIAN,
    areaName: 'Redes y conectividad',
  },
  {
    email: 'tecnico.infra@fixdesk.dev',
    name: 'Carlos Infra',
    role: Role.TECHNICIAN,
    areaName: 'Infraestructura física',
  },
  {
    email: 'tecnico.electrico@fixdesk.dev',
    name: 'Sofía Eléctrica',
    role: Role.TECHNICIAN,
    areaName: 'Instalaciones eléctricas',
  },
  {
    email: 'usuario@fixdesk.dev',
    name: 'María García',
    role: Role.USER,
  },
  {
    email: 'usuario2@fixdesk.dev',
    name: 'Pedro López',
    role: Role.USER,
  },
  {
    email: 'usuario3@fixdesk.dev',
    name: 'Ana Ruiz',
    role: Role.USER,
  },
  {
    email: 'usuario4@fixdesk.dev',
    name: 'Diego Morales',
    role: Role.USER,
  },
  {
    email: 'admin@fixdesk.dev',
    name: 'Ana Admin',
    role: Role.ADMIN,
  },
];

/**
 * Upsert de usuarios demo. Devuelve mapa email → id.
 */
export async function seedUsers(
  prisma: PrismaClient,
  areaByName: AreaNameMap,
): Promise<UsersSeedResult> {
  const passwordHash = await hashDemoPassword();

  for (const def of USER_DEFS) {
    const areaId = def.areaName ? areaByName[def.areaName] : null;
    if (def.areaName && !areaId) {
      throw new Error(`Área no encontrada para seed: ${def.areaName}`);
    }

    await prisma.user.upsert({
      where: { email: def.email },
      update: {
        name: def.name,
        passwordHash,
        role: def.role,
        areaId: areaId ?? null,
      },
      create: {
        email: def.email,
        name: def.name,
        passwordHash,
        role: def.role,
        areaId: areaId ?? null,
      },
    });
  }

  const users = await prisma.user.findMany({
    where: { email: { in: USER_DEFS.map((u) => u.email) } },
    select: { id: true, email: true },
  });
  const userByEmail: UserEmailMap = Object.fromEntries(
    users.map((u) => [u.email, u.id]),
  );

  console.log(`  ${USER_DEFS.length} usuarios demo`);
  console.log('  tecnico@fixdesk.dev / fixdesk123');
  console.log('  usuario@fixdesk.dev / fixdesk123');
  console.log('  admin@fixdesk.dev / fixdesk123');

  return { userByEmail };
}
