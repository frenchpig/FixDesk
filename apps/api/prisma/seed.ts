// Responsabilidad: orquestar el seed demo de FixDesk
// Usado por: bun prisma/seed.ts / prisma db seed
// NO hace: lógica de dominio de la API

import { PrismaClient } from '@prisma/client';
import { seedCatalog } from './seed/catalog';
import { seedTickets } from './seed/tickets';
import { seedUsers } from './seed/users';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed FixDesk — catálogos…');
  const { areaByName, labelByName } = await seedCatalog(prisma);

  console.log('Seed FixDesk — usuarios…');
  const { userByEmail } = await seedUsers(prisma, areaByName);

  console.log('Seed FixDesk — tickets / historial / notificaciones…');
  await seedTickets(prisma, { userByEmail, areaByName, labelByName });

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
