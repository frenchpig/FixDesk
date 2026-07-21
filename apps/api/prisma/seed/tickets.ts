// Responsabilidad: sembrar tickets demo con historial, labels y notificaciones
// Usado por: prisma/seed.ts
// NO hace: catálogos ni usuarios

import {
  HistoryEventType,
  NotificationType,
  TicketCategory,
  TicketPriority,
  TicketSeverity,
  type PrismaClient,
} from '@prisma/client';
import { CATEGORY_AREA_MAP } from '../../src/tickets/ticket-transitions';
import type { AreaNameMap, LabelNameMap } from './catalog';
import { daysAgo, hoursAfter } from './helpers';
import type { UserEmailMap } from './users';

type StatusKey =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED'
  | 'CANCELLED';

interface TicketSeedDef {
  title: string;
  description: string;
  category: TicketCategory;
  status: StatusKey;
  priority: TicketPriority;
  severity: TicketSeverity;
  location: string;
  reporterEmail: string;
  assigneeEmail?: string;
  /** Días hacia atrás desde ahora para createdAt */
  createdDaysAgo: number;
  createdHoursOffset?: number;
  /** Horas desde createdAt hasta resolvedAt (solo RESOLVED) */
  resolveAfterHours?: number;
  /** Horas desde createdAt hasta primera respuesta IN_PROGRESS */
  firstResponseHours?: number;
  labels?: string[];
  photo?: string;
  note?: string;
  cancelNote?: string;
  pendingNote?: string;
  notify?: boolean;
  notifyUnread?: boolean;
}

const TICKETS: TicketSeedDef[] = [
  // —— OPEN ——
  {
    title: 'Proyector del aula 201 no enciende',
    description:
      'Al conectar el proyector solo parpadea el LED rojo. Ya se probó otro cable HDMI.',
    category: TicketCategory.HARDWARE,
    status: 'OPEN',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.HIGH,
    location: 'Edificio A — Aula 201',
    reporterEmail: 'usuario@fixdesk.dev',
    createdDaysAgo: 1,
    labels: ['Urgente', 'Aula'],
    photo: 'placeholder:proyector-aula201.jpg',
    notify: true,
    notifyUnread: true,
  },
  {
    title: 'Mouse inalámbrico sin respuesta en laboratorio',
    description: 'El mouse del puesto 12 no conecta por Bluetooth ni USB dongle.',
    category: TicketCategory.HARDWARE,
    status: 'OPEN',
    priority: TicketPriority.LOW,
    severity: TicketSeverity.LOW,
    location: 'Lab Informática — Puesto 12',
    reporterEmail: 'usuario2@fixdesk.dev',
    createdDaysAgo: 0,
    createdHoursOffset: 2,
    labels: ['Aula'],
  },
  {
    title: 'WiFi inestable en biblioteca planta baja',
    description:
      'La red EDUCA-WIFI se desconecta cada 5–10 minutos en la zona de estudio.',
    category: TicketCategory.NETWORK,
    status: 'OPEN',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.CRITICAL,
    location: 'Biblioteca — Planta baja',
    reporterEmail: 'usuario3@fixdesk.dev',
    createdDaysAgo: 2,
    labels: ['Urgente', 'Campus'],
    notify: true,
    notifyUnread: true,
  },
  {
    title: 'Señalética caída en pasillo norte',
    description: 'El cartel de evacuación está suelto y cuelga de un tornillo.',
    category: TicketCategory.INFRASTRUCTURE,
    status: 'OPEN',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Edificio B — Pasillo norte',
    reporterEmail: 'usuario4@fixdesk.dev',
    createdDaysAgo: 3,
    labels: ['Campus'],
  },
  {
    title: 'Toma eléctrica sin corriente en cafetería',
    description: 'Ningún equipo conecta en el banco de tomas junto a la ventana.',
    category: TicketCategory.ELECTRICAL,
    status: 'OPEN',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.CRITICAL,
    location: 'Cafetería — Banco ventana',
    reporterEmail: 'usuario@fixdesk.dev',
    createdDaysAgo: 1,
    createdHoursOffset: 5,
    labels: ['Urgente', 'Exterior'],
    notify: true,
    notifyUnread: true,
  },
  {
    title: 'Teclado numérico fallando en recepción',
    description: 'Varias teclas del pad numérico no registran pulsaciones.',
    category: TicketCategory.HARDWARE,
    status: 'OPEN',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.LOW,
    location: 'Recepción principal',
    reporterEmail: 'usuario2@fixdesk.dev',
    createdDaysAgo: 4,
  },

  // —— IN_PROGRESS ——
  {
    title: 'PC del docente no arranca (pantalla negra)',
    description: 'Tras el logo de BIOS queda en negro. Se escucha el cooler.',
    category: TicketCategory.HARDWARE,
    status: 'IN_PROGRESS',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.HIGH,
    location: 'Edificio A — Sala docentes',
    reporterEmail: 'usuario3@fixdesk.dev',
    assigneeEmail: 'tecnico@fixdesk.dev',
    createdDaysAgo: 5,
    firstResponseHours: 3,
    labels: ['Aula'],
    note: 'Revisando fuente de poder y memoria RAM.',
    notify: true,
  },
  {
    title: 'Switch del rack 2 sin uplink',
    description: 'El puerto SFP del switch core hacia el rack 2 no negocia enlace.',
    category: TicketCategory.NETWORK,
    status: 'IN_PROGRESS',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.CRITICAL,
    location: 'Cuarto de servidores — Rack 2',
    reporterEmail: 'usuario@fixdesk.dev',
    assigneeEmail: 'tecnico.redes@fixdesk.dev',
    createdDaysAgo: 2,
    firstResponseHours: 1,
    labels: ['Urgente', 'Campus'],
    photo: 'placeholder:switch-rack2.jpg',
    note: 'Cambiando transceiver SFP; pendiente prueba de fibra.',
    notify: true,
    notifyUnread: true,
  },
  {
    title: 'Bicicletero suelto en estacionamiento',
    description: 'Dos anclajes del bicicletero B están flojos y se mueve.',
    category: TicketCategory.INFRASTRUCTURE,
    status: 'IN_PROGRESS',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Estacionamiento — Bicicletero B',
    reporterEmail: 'usuario4@fixdesk.dev',
    assigneeEmail: 'tecnico.infra@fixdesk.dev',
    createdDaysAgo: 6,
    firstResponseHours: 8,
    labels: ['Exterior'],
    note: 'Pedimos tornillería de expansión; llega mañana.',
  },
  {
    title: 'Luminaria LED parpadeando en pasillo',
    description: 'La luminaria del tramo medio parpadea de forma intermitente.',
    category: TicketCategory.ELECTRICAL,
    status: 'IN_PROGRESS',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Edificio C — Pasillo 2do piso',
    reporterEmail: 'usuario2@fixdesk.dev',
    assigneeEmail: 'tecnico.electrico@fixdesk.dev',
    createdDaysAgo: 3,
    firstResponseHours: 4,
    labels: ['Campus'],
    note: 'Driver LED sospechoso; se reemplaza en la tarde.',
  },
  {
    title: 'Impresora compartida atascada',
    description: 'Atasco de papel en la bandeja 2; el panel muestra error 13.20.',
    category: TicketCategory.HARDWARE,
    status: 'IN_PROGRESS',
    priority: TicketPriority.LOW,
    severity: TicketSeverity.LOW,
    location: 'Oficina administrativa',
    reporterEmail: 'usuario3@fixdesk.dev',
    assigneeEmail: 'tecnico@fixdesk.dev',
    createdDaysAgo: 1,
    firstResponseHours: 2,
    note: 'Limpiando rodillos; falta calibrar sensor.',
  },

  // —— PENDING ——
  {
    title: 'Solicitud de cable de red adicional aula 105',
    description:
      'Se necesita un patch cord Cat6 de 5 m; no hay stock en depósito.',
    category: TicketCategory.NETWORK,
    status: 'PENDING',
    priority: TicketPriority.LOW,
    severity: TicketSeverity.LOW,
    location: 'Edificio A — Aula 105',
    reporterEmail: 'usuario@fixdesk.dev',
    assigneeEmail: 'tecnico.redes@fixdesk.dev',
    createdDaysAgo: 8,
    firstResponseHours: 6,
    pendingNote: 'Esperando llegada de pedido de cables (OC-4521).',
    labels: ['Aula'],
  },
  {
    title: 'Monitor con manchas permanentes',
    description: 'Pantalla con burn-in; se cotiza reemplazo con proveedor.',
    category: TicketCategory.HARDWARE,
    status: 'PENDING',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Lab Multimedia — Puesto 3',
    reporterEmail: 'usuario4@fixdesk.dev',
    assigneeEmail: 'tecnico@fixdesk.dev',
    createdDaysAgo: 10,
    firstResponseHours: 5,
    pendingNote: 'Pendiente aprobación de compra del monitor.',
    labels: ['Recurrente'],
    notify: true,
  },
  {
    title: 'Reparación de puerta cortafuego',
    description: 'La puerta no cierra hermética; se requiere herraje especial.',
    category: TicketCategory.INFRASTRUCTURE,
    status: 'PENDING',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.HIGH,
    location: 'Edificio B — Escalera emergencia',
    reporterEmail: 'usuario2@fixdesk.dev',
    assigneeEmail: 'tecnico.infra@fixdesk.dev',
    createdDaysAgo: 7,
    firstResponseHours: 2,
    pendingNote: 'Esperando visita del contratista de herrajes.',
    labels: ['Urgente', 'Campus'],
  },
  {
    title: 'Tablero eléctrico con ruido anómalo',
    description:
      'Se escucha zumbido en el tablero T3; electricista externo programado.',
    category: TicketCategory.ELECTRICAL,
    status: 'PENDING',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.CRITICAL,
    location: 'Sótano técnico — Tablero T3',
    reporterEmail: 'usuario3@fixdesk.dev',
    assigneeEmail: 'tecnico.electrico@fixdesk.dev',
    createdDaysAgo: 4,
    firstResponseHours: 1,
    pendingNote: 'Visita del electricista autorizado el viernes 09:00.',
    labels: ['Urgente'],
    photo: 'placeholder:tablero-t3.jpg',
    notify: true,
    notifyUnread: true,
  },

  // —— RESOLVED (mix SLA in/out) ——
  {
    title: 'Reemplazo de teclado en aula 110',
    description: 'Teclado con teclas pegajosas; se cambió por stock.',
    category: TicketCategory.HARDWARE,
    status: 'RESOLVED',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.LOW,
    location: 'Edificio A — Aula 110',
    reporterEmail: 'usuario@fixdesk.dev',
    assigneeEmail: 'tecnico@fixdesk.dev',
    createdDaysAgo: 12,
    firstResponseHours: 2,
    resolveAfterHours: 24,
    labels: ['Aula'],
    note: 'Teclado reemplazado y probado.',
  },
  {
    title: 'Reinicio de AP del patio central',
    description: 'AP caído; se reinició y quedó online.',
    category: TicketCategory.NETWORK,
    status: 'RESOLVED',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.HIGH,
    location: 'Patio central',
    reporterEmail: 'usuario2@fixdesk.dev',
    assigneeEmail: 'tecnico.redes@fixdesk.dev',
    createdDaysAgo: 9,
    firstResponseHours: 1,
    resolveAfterHours: 6,
    labels: ['Exterior', 'Campus'],
    note: 'AP reiniciado; uptime estable 48h.',
    notify: true,
  },
  {
    title: 'Ajuste de silla ergonómica oficina 4',
    description: 'Respaldo trabado; se lubricó el mecanismo.',
    category: TicketCategory.INFRASTRUCTURE,
    status: 'RESOLVED',
    priority: TicketPriority.LOW,
    severity: TicketSeverity.LOW,
    location: 'Oficina 4',
    reporterEmail: 'usuario3@fixdesk.dev',
    assigneeEmail: 'tecnico.infra@fixdesk.dev',
    createdDaysAgo: 15,
    firstResponseHours: 10,
    resolveAfterHours: 36,
    note: 'Mecanismo liberado; usuario confirma OK.',
  },
  {
    title: 'Cambio de bombillas en baño hombres',
    description: 'Tres luminarias quemadas; se reemplazaron LED.',
    category: TicketCategory.ELECTRICAL,
    status: 'RESOLVED',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Edificio A — Baño hombres PB',
    reporterEmail: 'usuario4@fixdesk.dev',
    assigneeEmail: 'tecnico.electrico@fixdesk.dev',
    createdDaysAgo: 11,
    firstResponseHours: 4,
    resolveAfterHours: 20,
    labels: ['Campus'],
    note: 'LED instalados; medición de lux OK.',
  },
  {
    title: 'Configuración de impresora en red nueva',
    description: 'IP estática y cola compartida en el servidor de impresión.',
    category: TicketCategory.NETWORK,
    status: 'RESOLVED',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Oficina decanato',
    reporterEmail: 'usuario@fixdesk.dev',
    assigneeEmail: 'tecnico.redes@fixdesk.dev',
    createdDaysAgo: 20,
    firstResponseHours: 3,
    resolveAfterHours: 30,
    note: 'Cola creada; prueba de impresión OK.',
  },
  // SLA incumplido (>48h)
  {
    title: 'Reparación mayor de proyector auditorio',
    description:
      'Lámpara y ventilador fallidos; se esperó repuesto importado.',
    category: TicketCategory.HARDWARE,
    status: 'RESOLVED',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.HIGH,
    location: 'Auditorio principal',
    reporterEmail: 'usuario2@fixdesk.dev',
    assigneeEmail: 'tecnico@fixdesk.dev',
    createdDaysAgo: 25,
    firstResponseHours: 5,
    resolveAfterHours: 96,
    labels: ['Recurrente', 'Campus'],
    photo: 'placeholder:proyector-auditorio.jpg',
    note: 'Repuesto instalado tras demora de proveedor.',
    notify: true,
  },
  {
    title: 'Recableado parcial laboratorio química',
    description: 'Canaletas dañadas; obra civil retrasó el cierre.',
    category: TicketCategory.INFRASTRUCTURE,
    status: 'RESOLVED',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Lab Química — Módulo 2',
    reporterEmail: 'usuario3@fixdesk.dev',
    assigneeEmail: 'tecnico.infra@fixdesk.dev',
    createdDaysAgo: 28,
    firstResponseHours: 12,
    resolveAfterHours: 72,
    labels: ['Aula'],
    note: 'Canaletas nuevas y cableado ordenado.',
  },
  {
    title: 'Falla intermitente en UPS sala servers',
    description: 'Bypass manual hasta llegada de baterías; luego estabilizado.',
    category: TicketCategory.ELECTRICAL,
    status: 'RESOLVED',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.CRITICAL,
    location: 'Cuarto de servidores',
    reporterEmail: 'usuario4@fixdesk.dev',
    assigneeEmail: 'tecnico.electrico@fixdesk.dev',
    createdDaysAgo: 22,
    firstResponseHours: 2,
    resolveAfterHours: 80,
    labels: ['Urgente', 'Campus'],
    note: 'Baterías reemplazadas; autotest UPS OK.',
    notify: true,
  },
  {
    title: 'Actualización de firmware en switch edge',
    description: 'Firmware viejo causaba caídas; actualizado en ventana nocturna.',
    category: TicketCategory.NETWORK,
    status: 'RESOLVED',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.HIGH,
    location: 'Edificio C — Rack edge',
    reporterEmail: 'usuario@fixdesk.dev',
    assigneeEmail: 'tecnico.redes@fixdesk.dev',
    createdDaysAgo: 18,
    firstResponseHours: 8,
    resolveAfterHours: 40,
    note: 'Firmware 15.2.x aplicado; monitoreo 72h sin incidentes.',
  },

  // —— CANCELLED ——
  {
    title: 'Solicitud de segundo monitor (duplicada)',
    description: 'El usuario ya tenía ticket abierto por el mismo pedido.',
    category: TicketCategory.HARDWARE,
    status: 'CANCELLED',
    priority: TicketPriority.LOW,
    severity: TicketSeverity.LOW,
    location: 'Oficina 7',
    reporterEmail: 'usuario2@fixdesk.dev',
    assigneeEmail: 'tecnico@fixdesk.dev',
    createdDaysAgo: 14,
    firstResponseHours: 4,
    cancelNote: 'Duplicado del ticket anterior; se cancela este.',
    notify: true,
  },
  {
    title: 'Reporte de WiFi en edificio demolido',
    description: 'El ala Este ya no está en uso; el AP se retiró del inventario.',
    category: TicketCategory.NETWORK,
    status: 'CANCELLED',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Edificio Este (fuera de servicio)',
    reporterEmail: 'usuario3@fixdesk.dev',
    createdDaysAgo: 16,
    cancelNote: 'Ubicación fuera de servicio; no aplica intervención.',
  },
  {
    title: 'Pintura de barandal (solicitado por error)',
    description: 'El reporte correspondía a mantenimiento externo, no FixDesk.',
    category: TicketCategory.INFRASTRUCTURE,
    status: 'CANCELLED',
    priority: TicketPriority.LOW,
    severity: TicketSeverity.LOW,
    location: 'Escalera exterior',
    reporterEmail: 'usuario4@fixdesk.dev',
    createdDaysAgo: 19,
    cancelNote: 'Fuera de alcance de FixDesk; derivado a mantenimiento.',
    labels: ['Exterior'],
  },
  {
    title: 'Corte programado mal reportado como falla',
    description: 'Había aviso de mantenimiento eléctrico; no era incidente.',
    category: TicketCategory.ELECTRICAL,
    status: 'CANCELLED',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.HIGH,
    location: 'Campus completo',
    reporterEmail: 'usuario@fixdesk.dev',
    assigneeEmail: 'tecnico.electrico@fixdesk.dev',
    createdDaysAgo: 6,
    firstResponseHours: 1,
    cancelNote: 'Corte programado comunicado; no hay falla.',
    notify: true,
  },

  // —— Más variedad reciente para trends ——
  {
    title: 'Webcam de sala de reuniones sin imagen',
    description: 'Dispositivo reconocido pero stream negro en Meet.',
    category: TicketCategory.HARDWARE,
    status: 'OPEN',
    priority: TicketPriority.MEDIUM,
    severity: TicketSeverity.MEDIUM,
    location: 'Sala de reuniones 3',
    reporterEmail: 'usuario3@fixdesk.dev',
    createdDaysAgo: 0,
    createdHoursOffset: 1,
    labels: ['Campus'],
  },
  {
    title: 'Latencia alta hacia el servidor de archivos',
    description: 'Copias de archivos >100 MB tardan más de 5 minutos.',
    category: TicketCategory.NETWORK,
    status: 'IN_PROGRESS',
    priority: TicketPriority.HIGH,
    severity: TicketSeverity.HIGH,
    location: 'Campus — VLAN administrativa',
    reporterEmail: 'usuario4@fixdesk.dev',
    assigneeEmail: 'tecnico.redes@fixdesk.dev',
    createdDaysAgo: 1,
    firstResponseHours: 2,
    labels: ['Recurrente'],
    note: 'Midiendo throughput; posible saturación en uplink.',
    notify: true,
    notifyUnread: true,
  },
];

function requireUser(userByEmail: UserEmailMap, email: string): string {
  const id = userByEmail[email];
  if (!id) throw new Error(`Usuario seed no encontrado: ${email}`);
  return id;
}

function areaIdForCategory(
  areaByName: AreaNameMap,
  category: TicketCategory,
): string {
  const areaName = CATEGORY_AREA_MAP[category];
  const id = areaByName[areaName];
  if (!id) throw new Error(`Área seed no encontrada: ${areaName}`);
  return id;
}

/**
 * Crea el dataset demo de tickets (asume DB ya reseteada por resetDemoDatabase).
 */
export async function seedTickets(
  prisma: PrismaClient,
  deps: {
    userByEmail: UserEmailMap;
    areaByName: AreaNameMap;
    labelByName: LabelNameMap;
  },
): Promise<{ tickets: number; history: number; notifications: number }> {
  const { userByEmail, areaByName, labelByName } = deps;

  let historyCount = 0;
  let notificationCount = 0;

  for (const def of TICKETS) {
    const createdAt = daysAgo(def.createdDaysAgo, def.createdHoursOffset ?? 0);
    const reporterId = requireUser(userByEmail, def.reporterEmail);
    const assigneeId = def.assigneeEmail
      ? requireUser(userByEmail, def.assigneeEmail)
      : null;
    const areaId = areaIdForCategory(areaByName, def.category);

    const resolvedAt =
      def.status === 'RESOLVED' && def.resolveAfterHours != null
        ? hoursAfter(createdAt, def.resolveAfterHours)
        : null;

    const labelIds = (def.labels ?? [])
      .map((name) => labelByName[name])
      .filter((id): id is string => Boolean(id));

    const ticket = await prisma.ticket.create({
      data: {
        title: def.title,
        description: def.description,
        category: def.category,
        status: def.status,
        priority: def.priority,
        severity: def.severity,
        location: def.location,
        photoUrl: def.photo ?? null,
        reporterId,
        assigneeId,
        areaId,
        resolvedAt,
        createdAt,
        updatedAt: resolvedAt ?? createdAt,
        labels:
          labelIds.length > 0
            ? { connect: labelIds.map((id) => ({ id })) }
            : undefined,
      },
    });

    const historyRows: {
      ticketId: string;
      userId: string;
      eventType: HistoryEventType;
      oldStatus?: string;
      newStatus?: string;
      note?: string;
      createdAt: Date;
    }[] = [];

    historyRows.push({
      ticketId: ticket.id,
      userId: reporterId,
      eventType: HistoryEventType.CREATED,
      newStatus: 'OPEN',
      createdAt,
    });

    if (def.photo) {
      historyRows.push({
        ticketId: ticket.id,
        userId: reporterId,
        eventType: HistoryEventType.PHOTO_ADDED,
        note: def.photo,
        createdAt: hoursAfter(createdAt, 0.05),
      });
    }

    const actorId = assigneeId ?? reporterId;
    let cursor = createdAt;

    if (assigneeId) {
      const assignedAt = hoursAfter(
        createdAt,
        Math.min(def.firstResponseHours ?? 2, 2),
      );
      historyRows.push({
        ticketId: ticket.id,
        userId: actorId,
        eventType: HistoryEventType.ASSIGNED,
        note: `Asignado a técnico`,
        createdAt: assignedAt,
      });
      cursor = assignedAt;

      if (def.notify) {
        await prisma.notification.create({
          data: {
            userId: assigneeId,
            ticketId: ticket.id,
            type: NotificationType.ASSIGNED,
            title: 'Ticket asignado',
            body: def.title,
            readAt: def.notifyUnread ? null : hoursAfter(assignedAt, 1),
            createdAt: assignedAt,
          },
        });
        notificationCount += 1;
      }
    }

    const needsProgress =
      def.status === 'IN_PROGRESS' ||
      def.status === 'PENDING' ||
      def.status === 'RESOLVED' ||
      (def.status === 'CANCELLED' && def.firstResponseHours != null);

    if (needsProgress) {
      const frHours = def.firstResponseHours ?? 3;
      const inProgressAt = hoursAfter(createdAt, frHours);
      historyRows.push({
        ticketId: ticket.id,
        userId: actorId,
        eventType: HistoryEventType.STATUS_CHANGED,
        oldStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        createdAt: inProgressAt,
      });
      cursor = inProgressAt;

      if (def.notify && assigneeId) {
        await prisma.notification.create({
          data: {
            userId: reporterId,
            ticketId: ticket.id,
            type: NotificationType.STATUS_CHANGED,
            title: 'Estado actualizado',
            body: `${def.title} → En progreso`,
            readAt: def.notifyUnread ? null : hoursAfter(inProgressAt, 2),
            createdAt: inProgressAt,
          },
        });
        notificationCount += 1;
      }
    }

    if (def.status === 'PENDING') {
      const pendingAt = hoursAfter(cursor, 6);
      historyRows.push({
        ticketId: ticket.id,
        userId: actorId,
        eventType: HistoryEventType.STATUS_CHANGED,
        oldStatus: 'IN_PROGRESS',
        newStatus: 'PENDING',
        note: def.pendingNote ?? 'En espera de insumos o terceros.',
        createdAt: pendingAt,
      });
      cursor = pendingAt;
    }

    if (def.status === 'RESOLVED') {
      const resolveAt = resolvedAt ?? hoursAfter(cursor, 12);
      historyRows.push({
        ticketId: ticket.id,
        userId: actorId,
        eventType: HistoryEventType.STATUS_CHANGED,
        oldStatus: 'IN_PROGRESS',
        newStatus: 'RESOLVED',
        note: def.note ?? 'Incidente resuelto.',
        createdAt: resolveAt,
      });
      cursor = resolveAt;

      if (def.notify) {
        await prisma.notification.create({
          data: {
            userId: reporterId,
            ticketId: ticket.id,
            type: NotificationType.STATUS_CHANGED,
            title: 'Ticket resuelto',
            body: def.title,
            readAt: def.notifyUnread ? null : hoursAfter(resolveAt, 3),
            createdAt: resolveAt,
          },
        });
        notificationCount += 1;
      }
    }

    if (def.status === 'CANCELLED') {
      const cancelAt = hoursAfter(
        cursor,
        def.firstResponseHours != null ? 8 : 2,
      );
      const oldStatus =
        def.firstResponseHours != null ? 'IN_PROGRESS' : 'OPEN';
      historyRows.push({
        ticketId: ticket.id,
        userId: actorId,
        eventType: HistoryEventType.STATUS_CHANGED,
        oldStatus,
        newStatus: 'CANCELLED',
        note: def.cancelNote ?? 'Ticket cancelado.',
        createdAt: cancelAt,
      });
      cursor = cancelAt;
    }

    if (def.note && def.status === 'IN_PROGRESS') {
      const noteAt = hoursAfter(cursor, 1);
      historyRows.push({
        ticketId: ticket.id,
        userId: actorId,
        eventType: HistoryEventType.NOTE_ADDED,
        note: def.note,
        createdAt: noteAt,
      });

      if (def.notify) {
        await prisma.notification.create({
          data: {
            userId: reporterId,
            ticketId: ticket.id,
            type: NotificationType.NOTE_ADDED,
            title: 'Nueva nota en tu ticket',
            body: def.note,
            readAt: def.notifyUnread ? null : hoursAfter(noteAt, 1),
            createdAt: noteAt,
          },
        });
        notificationCount += 1;
      }
    }

    await prisma.ticketHistory.createMany({ data: historyRows });
    historyCount += historyRows.length;
  }

  console.log(`  ${TICKETS.length} tickets`);
  console.log(`  ${historyCount} entradas de historial`);
  console.log(`  ${notificationCount} notificaciones`);

  return {
    tickets: TICKETS.length,
    history: historyCount,
    notifications: notificationCount,
  };
}
