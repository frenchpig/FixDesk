import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from '../history/history.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {
  AddNoteDto,
  AssignTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
} from './dto/update-ticket.dto';
import {
  HistoryEventType,
  NotificationType,
  Role,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
  type Prisma,
  type TicketCategory,
} from '@prisma/client';
import { CATEGORY_AREA_MAP } from './ticket-transitions';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRealtimeGateway } from '../notifications/notifications-realtime/notifications-realtime.gateway';
import { LabelsService } from '../labels/labels.service';
import { WorkflowService } from '../workflow/workflow.service';
import type { JwtPayload } from '../auth/types/jwt-payload';

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardware',
  NETWORK: 'Redes',
  INFRASTRUCTURE: 'Infraestructura',
  ELECTRICAL: 'Eléctrico',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const SEVERITY_LABELS: Record<TicketSeverity, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

interface ListTicketsQuery {
  page?: number;
  perPage?: number;
  status?: TicketStatus;
  priority?: string;
  severity?: string;
  category?: TicketCategory;
  assigneeId?: string;
  resolvedToday?: boolean;
  createdToday?: boolean;
  q?: string;
  labelId?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyService: HistoryService,
    private readonly notificationsService: NotificationsService,
    private readonly labelsService: LabelsService,
    private readonly realtimeGateway: NotificationsRealtimeGateway,
    private readonly workflowService: WorkflowService,
  ) {}

  async create(dto: CreateTicketDto, user: JwtPayload) {
    const area = await this.prisma.area.findUnique({
      where: { name: CATEGORY_AREA_MAP[dto.category] },
    });

    const labelIds = [...new Set(dto.labelIds ?? [])];
    await this.labelsService.assertLabelsExist(labelIds);

    const canSetTriage =
      user.role === Role.TECHNICIAN || user.role === Role.ADMIN;

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        location: dto.location,
        photoUrl: dto.photoUrl,
        ...(canSetTriage
          ? {
              ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
              ...(dto.severity !== undefined
                ? { severity: dto.severity }
                : {}),
            }
          : {}),
        reporterId: user.sub,
        areaId: area?.id,
        ...(labelIds.length
          ? { labels: { connect: labelIds.map((id) => ({ id })) } }
          : {}),
      },
      include: this.ticketInclude(),
    });

    await this.historyService.create({
      ticketId: ticket.id,
      userId: user.sub,
      eventType: HistoryEventType.CREATED,
      newStatus: TicketStatus.OPEN,
    });

    if (dto.photoUrl) {
      const filename = dto.photoUrl.startsWith('placeholder:')
        ? decodeURIComponent(dto.photoUrl.slice('placeholder:'.length))
        : dto.photoUrl;
      await this.historyService.create({
        ticketId: ticket.id,
        userId: user.sub,
        eventType: HistoryEventType.PHOTO_ADDED,
        note: filename,
        metadata: { photoUrl: dto.photoUrl, simulated: true },
      });
    }

    this.realtimeGateway.emitTicketEvent({
      ticketId: ticket.id,
      action: 'created',
      reporterId: ticket.reporterId,
    });

    return { data: ticket };
  }

  async findAll(user: JwtPayload, query: ListTicketsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 20));
    const where = this.buildWhereClause(user, query);

    const [total, tickets] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: this.ticketListInclude(),
      }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: string, user: JwtPayload) {
    const authTicket = await this.getTicketOrThrow(id);
    this.assertCanView(authTicket, user);

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: this.ticketInclude(),
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    return { data: ticket };
  }

  async update(id: string, dto: UpdateTicketDto, user: JwtPayload) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertTechnicianAccess(ticket, user);

    const data: Prisma.TicketUpdateInput = {};
    const changeLabels: string[] = [];
    const metadata: Record<string, { from: string; to: string }> = {};

    if (dto.title !== undefined && dto.title.trim() !== ticket.title) {
      const next = dto.title.trim();
      data.title = next;
      changeLabels.push('título');
      metadata.title = { from: ticket.title, to: next };
    }

    if (
      dto.description !== undefined &&
      dto.description.trim() !== ticket.description
    ) {
      const next = dto.description.trim();
      data.description = next;
      changeLabels.push('descripción');
      metadata.description = {
        from: ticket.description.slice(0, 80),
        to: next.slice(0, 80),
      };
    }

    if (dto.location !== undefined && dto.location.trim() !== ticket.location) {
      const next = dto.location.trim();
      data.location = next;
      changeLabels.push('ubicación');
      metadata.location = { from: ticket.location, to: next };
    }

    if (dto.priority !== undefined && dto.priority !== ticket.priority) {
      data.priority = dto.priority;
      changeLabels.push('prioridad');
      metadata.priority = {
        from: PRIORITY_LABELS[ticket.priority],
        to: PRIORITY_LABELS[dto.priority],
      };
    }

    if (dto.severity !== undefined && dto.severity !== ticket.severity) {
      data.severity = dto.severity;
      changeLabels.push('severidad');
      metadata.severity = {
        from: SEVERITY_LABELS[ticket.severity],
        to: SEVERITY_LABELS[dto.severity],
      };
    }

    if (dto.category !== undefined && dto.category !== ticket.category) {
      data.category = dto.category;
      changeLabels.push('categoría');
      metadata.category = {
        from: CATEGORY_LABELS[ticket.category],
        to: CATEGORY_LABELS[dto.category],
      };

      const area = await this.prisma.area.findUnique({
        where: { name: CATEGORY_AREA_MAP[dto.category] },
      });
      data.area = area
        ? { connect: { id: area.id } }
        : { disconnect: true };
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay cambios para guardar');
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data,
      include: this.ticketInclude(),
    });

    await this.historyService.create({
      ticketId: id,
      userId: user.sub,
      eventType: HistoryEventType.UPDATED,
      note: `Actualizó: ${changeLabels.join(', ')}`,
      metadata,
    });

    this.realtimeGateway.emitTicketEvent({
      ticketId: id,
      action: 'updated',
      reporterId: updated.reporterId,
    });

    return { data: updated };
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto, user: JwtPayload) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertTechnicianAccess(ticket, user);

    const workflow = await this.workflowService.getResolvedWorkflow();

    if (
      !this.workflowService.isTransitionAllowed(
        workflow,
        ticket.status,
        dto.status,
      )
    ) {
      throw new BadRequestException(
        `Transición inválida: ${ticket.status} → ${dto.status}`,
      );
    }

    if (
      this.workflowService.isNoteRequired(
        workflow,
        ticket.status,
        dto.status,
      ) &&
      !dto.note?.trim()
    ) {
      throw new BadRequestException(
        'Se requiere una razón para este cambio de estado',
      );
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: dto.status === TicketStatus.RESOLVED ? new Date() : null,
      },
      include: this.ticketInclude(),
    });

    await this.historyService.create({
      ticketId: id,
      userId: user.sub,
      eventType: HistoryEventType.STATUS_CHANGED,
      oldStatus: ticket.status,
      newStatus: dto.status,
      note: dto.note,
    });

    await this.notificationsService.createForUsers(
      [ticket.reporterId, ticket.assigneeId].filter(Boolean) as string[],
      {
        type: NotificationType.STATUS_CHANGED,
        title: `Estado actualizado: «${updated.title}»`,
        body: `${this.workflowService.getStatusLabel(workflow, ticket.status)} → ${this.workflowService.getStatusLabel(workflow, dto.status)}`,
        ticketId: id,
        actorId: user.sub,
      },
    );

    this.realtimeGateway.emitTicketEvent({
      ticketId: id,
      action: 'status_changed',
      reporterId: updated.reporterId,
    });

    return { data: updated };
  }

  async assign(id: string, dto: AssignTicketDto, user: JwtPayload) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertTechnicianAccess(ticket, user);

    const assigneeId = dto.assigneeId ?? user.sub;
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { assigneeId },
      include: this.ticketInclude(),
    });

    await this.historyService.create({
      ticketId: id,
      userId: user.sub,
      eventType: HistoryEventType.ASSIGNED,
      metadata: { assigneeId },
    });

    await this.notificationsService.createForUsers([assigneeId], {
      type: NotificationType.ASSIGNED,
      title: `Te asignaron el ticket «${updated.title}»`,
      body: 'Revisa el detalle para continuar la atención.',
      ticketId: id,
      actorId: user.sub,
    });

    this.realtimeGateway.emitTicketEvent({
      ticketId: id,
      action: 'assigned',
      reporterId: updated.reporterId,
    });

    return { data: updated };
  }

  async addNote(id: string, dto: AddNoteDto, user: JwtPayload) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertTechnicianAccess(ticket, user);

    const entry = await this.historyService.create({
      ticketId: id,
      userId: user.sub,
      eventType: HistoryEventType.NOTE_ADDED,
      note: dto.note,
    });

    await this.notificationsService.createForUsers(
      [ticket.reporterId, ticket.assigneeId].filter(Boolean) as string[],
      {
        type: NotificationType.NOTE_ADDED,
        title: `Nuevo comentario en «${ticket.title}»`,
        body: dto.note.slice(0, 140),
        ticketId: id,
        actorId: user.sub,
      },
    );

    this.realtimeGateway.emitTicketEvent({
      ticketId: id,
      action: 'note_added',
      reporterId: ticket.reporterId,
    });

    return { data: entry };
  }

  async setLabels(id: string, labelIds: string[], user: JwtPayload) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertTechnicianAccess(ticket, user);

    const unique = [...new Set(labelIds)];
    await this.labelsService.assertLabelsExist(unique);

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        labels: { set: unique.map((labelId) => ({ id: labelId })) },
      },
      include: this.ticketInclude(),
    });

    this.realtimeGateway.emitTicketEvent({
      ticketId: id,
      action: 'labels_changed',
      reporterId: updated.reporterId,
    });

    return { data: updated };
  }

  async getHistory(id: string, user: JwtPayload) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertCanView(ticket, user);

    const history = await this.historyService.findByTicketId(id);
    return { data: history };
  }

  private buildWhereClause(
    user: JwtPayload,
    query: ListTicketsQuery,
  ): Prisma.TicketWhereInput {
    const and: Prisma.TicketWhereInput[] = [];

    if (user.role === Role.USER) {
      and.push({ reporterId: user.sub });
    } else if (user.role === Role.TECHNICIAN) {
      // Alineado con assertTechnicianAccess: área propia, asignados a mí,
      // o sin asignar (cola general, cualquier área).
      and.push({
        OR: [
          { assigneeId: user.sub },
          { area: { technicians: { some: { id: user.sub } } } },
          { assigneeId: null },
        ],
      });
    }

    if (query.status) and.push({ status: query.status });
    if (query.priority) {
      and.push({
        priority: query.priority as Prisma.EnumTicketPriorityFilter,
      });
    }
    if (query.severity) {
      and.push({
        severity: query.severity as Prisma.EnumTicketSeverityFilter,
      });
    }
    if (query.category) and.push({ category: query.category });

    if (query.assigneeId === 'me') {
      and.push({ assigneeId: user.sub });
    } else if (query.assigneeId?.trim()) {
      and.push({ assigneeId: query.assigneeId.trim() });
    }

    if (query.resolvedToday) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      and.push({
        status: TicketStatus.RESOLVED,
        resolvedAt: { gte: start },
      });
    }

    if (query.createdToday) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      and.push({ createdAt: { gte: start } });
    }

    const createdAt: Prisma.DateTimeFilter = {};
    if (query.dateFrom) {
      createdAt.gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    }
    if (query.dateTo) {
      createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }
    if (Object.keys(createdAt).length > 0) {
      and.push({ createdAt });
    }

    if (query.location?.trim()) {
      and.push({
        location: {
          contains: query.location.trim(),
          mode: 'insensitive',
        },
      });
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      and.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (query.labelId) {
      and.push({ labels: { some: { id: query.labelId } } });
    }

    if (and.length === 0) return {};
    if (and.length === 1) return and[0]!;
    return { AND: and };
  }

  private async getTicketOrThrow(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { area: { include: { technicians: true } } },
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return ticket;
  }

  private assertCanView(
    ticket: {
      reporterId: string;
      assigneeId: string | null;
      area?: { technicians: { id: string }[] } | null;
    },
    user: JwtPayload,
  ) {
    const inArea =
      ticket.area?.technicians.some((t) => t.id === user.sub) ?? false;
    const assigned = ticket.assigneeId === user.sub;
    const isReporter = ticket.reporterId === user.sub;
    const unassigned = ticket.assigneeId === null;

    if (user.role === Role.ADMIN) return;

    if (user.role === Role.USER && !isReporter) {
      throw new ForbiddenException('No tienes permiso para ver este ticket');
    }

    if (user.role === Role.TECHNICIAN) {
      // Misma regla que el listado y assertTechnicianAccess:
      // área, asignado a mí, reportado por mí, o sin asignar (cola).
      if (!inArea && !assigned && !isReporter && !unassigned) {
        throw new ForbiddenException('No tienes permiso para ver este ticket');
      }
    }
  }

  private assertTechnicianAccess(
    ticket: {
      assigneeId: string | null;
      area?: { technicians: { id: string }[] } | null;
    },
    user: JwtPayload,
  ) {
    if (user.role === Role.ADMIN) return;
    if (user.role !== Role.TECHNICIAN) {
      throw new ForbiddenException('Solo técnicos pueden realizar esta acción');
    }

    const inArea = ticket.area?.technicians.some((t) => t.id === user.sub);
    const assigned = ticket.assigneeId === user.sub;
    if (!inArea && !assigned && ticket.assigneeId !== null) {
      throw new ForbiddenException('No tienes permiso sobre este ticket');
    }
  }

  private ticketInclude() {
    return {
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true } },
      area: { select: { id: true, name: true } },
      labels: { select: { id: true, name: true, color: true } },
    };
  }

  private ticketListInclude() {
    return {
      reporter: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      labels: { select: { id: true, name: true, color: true } },
    };
  }
}
