import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const areas = [
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
];

async function main() {
  for (const area of areas) {
    await prisma.area.upsert({
      where: { name: area.name },
      update: {},
      create: area,
    });
  }

  const hardwareArea = await prisma.area.findUniqueOrThrow({
    where: { name: 'Hardware y equipos' },
  });

  const passwordHash = await bcrypt.hash('fixdesk123', 10);

  await prisma.user.upsert({
    where: { email: 'tecnico@fixdesk.dev' },
    update: {},
    create: {
      email: 'tecnico@fixdesk.dev',
      name: 'Juan Técnico',
      passwordHash,
      role: Role.TECHNICIAN,
      areaId: hardwareArea.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'usuario@fixdesk.dev' },
    update: {},
    create: {
      email: 'usuario@fixdesk.dev',
      name: 'María García',
      passwordHash,
      role: Role.USER,
    },
  });

  console.log('Seed completado');
  console.log('  tecnico@fixdesk.dev / fixdesk123');
  console.log('  usuario@fixdesk.dev / fixdesk123');

  const labels = [
    { name: 'Urgente', color: '#EF4444' },
    { name: 'Recurrente', color: '#F59E0B' },
    { name: 'Campus', color: '#3B82F6' },
    { name: 'Aula', color: '#8B5CF6' },
    { name: 'Exterior', color: '#10B981' },
  ];

  for (const label of labels) {
    await prisma.label.upsert({
      where: { name: label.name },
      update: { color: label.color },
      create: label,
    });
  }

  console.log(`  ${labels.length} etiquetas seed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
