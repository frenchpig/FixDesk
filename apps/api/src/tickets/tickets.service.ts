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
  UpdateTicketStatusDto,
} from './dto/update-ticket.dto';
import {
  HistoryEventType,
  NotificationType,
  Role,
  TicketStatus,
  type Prisma,
  type TicketCategory,
} from '@prisma/client';
import {
  ALLOWED_TRANSITIONS,
  CATEGORY_AREA_MAP,
  isNoteRequiredForTransition,
} from './ticket-transitions';
import { NotificationsService } from '../notifications/notifications.service';
import type { JwtPayload } from '../auth/types/jwt-payload';

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelto',
  CANCELLED: 'Cancelado',
};

interface ListTicketsQuery {
  page?: number;
  perPage?: number;
  status?: TicketStatus;
  priority?: string;
  category?: TicketCategory;
  assigneeId?: string;
  resolvedToday?: boolean;
  createdToday?: boolean;
  q?: string;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyService: HistoryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateTicketDto, user: JwtPayload) {
    const area = await this.prisma.area.findUnique({
      where: { name: CATEGORY_AREA_MAP[dto.category] },
    });

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        location: dto.location,
        photoUrl: dto.photoUrl,
        priority: dto.priority,
        reporterId: user.sub,
        areaId: area?.id,
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

  async updateStatus(id: string, dto: UpdateTicketStatusDto, user: JwtPayload) {
    const ticket = await this.getTicketOrThrow(id);
    this.assertTechnicianAccess(ticket, user);

    if (!ALLOWED_TRANSITIONS[ticket.status].includes(dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${ticket.status} → ${dto.status}`,
      );
    }

    if (
      isNoteRequiredForTransition(ticket.status, dto.status) &&
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
        body: `${STATUS_LABELS[ticket.status]} → ${STATUS_LABELS[dto.status]}`,
        ticketId: id,
        actorId: user.sub,
      },
    );

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

    return { data: entry };
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
    const where: Prisma.TicketWhereInput = {};

    if (user.role === Role.USER) {
      where.reporterId = user.sub;
    } else if (user.role === Role.TECHNICIAN) {
      where.OR = [
        { assigneeId: user.sub },
        { area: { technicians: { some: { id: user.sub } } } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.priority) {
      where.priority = query.priority as Prisma.EnumTicketPriorityFilter;
    }
    if (query.category) where.category = query.category;

    if (query.assigneeId === 'me') {
      where.assigneeId = user.sub;
    }

    if (query.resolvedToday) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      where.status = TicketStatus.RESOLVED;
      where.resolvedAt = { gte: start };
    }

    if (query.createdToday) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start };
    }

    if (query.q?.trim()) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return where;
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

    if (user.role === Role.ADMIN) return;

    if (user.role === Role.USER && !isReporter) {
      throw new ForbiddenException('No tienes permiso para ver este ticket');
    }

    if (user.role === Role.TECHNICIAN) {
      if (!inArea && !assigned && !isReporter) {
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
    };
  }

  private ticketListInclude() {
    return {
      reporter: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    };
  }
}
