import { Injectable } from '@nestjs/common';
import {
  HistoryEventType,
  Role,
  TicketStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/types/jwt-payload';
import type { ReportQueryDto } from './dto/report-query.dto';
import {
  buildReportsExcel,
  buildReportsPdf,
} from './reports-export.builder';
import { SettingsService } from '../settings/settings.service';

const OPEN_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.PENDING,
];

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async getMetrics(user: JwtPayload, query: ReportQueryDto) {
    const { dateFrom, dateTo } = this.resolveDateRange(query);
    const baseWhere = this.buildFilterWhere(user, query);
    const slaTargetHours = await this.settings.getSlaTargetHours();

    const periodCreatedWhere: Prisma.TicketWhereInput = {
      ...baseWhere,
      createdAt: { gte: dateFrom, lte: dateTo },
    };

    const periodResolvedWhere: Prisma.TicketWhereInput = {
      ...baseWhere,
      status: TicketStatus.RESOLVED,
      resolvedAt: { gte: dateFrom, lte: dateTo },
    };

    const [
      created,
      resolved,
      cancelled,
      openBacklog,
      inProgress,
      pending,
      highPriorityOpen,
      criticalSeverityOpen,
      byStatus,
      byCategory,
      byPriority,
      bySeverity,
      byAreaRaw,
      byAssigneeRaw,
      byReporterRaw,
      resolvedTickets,
      trendTickets,
      firstResponseEntries,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: periodCreatedWhere }),
      this.prisma.ticket.count({ where: periodResolvedWhere }),
      this.prisma.ticket.count({
        where: {
          ...periodCreatedWhere,
          status: TicketStatus.CANCELLED,
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { in: OPEN_STATUSES },
        },
      }),
      this.prisma.ticket.count({
        where: { ...baseWhere, status: TicketStatus.IN_PROGRESS },
      }),
      this.prisma.ticket.count({
        where: { ...baseWhere, status: TicketStatus.PENDING },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          priority: 'HIGH',
          status: { in: OPEN_STATUSES },
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          severity: 'CRITICAL',
          status: { in: OPEN_STATUSES },
        },
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: { ...baseWhere, createdAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['category'],
        where: { ...baseWhere, createdAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where: { ...baseWhere, createdAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['severity'],
        where: { ...baseWhere, createdAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['areaId'],
        where: { ...baseWhere, createdAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['assigneeId'],
        where: {
          ...baseWhere,
          createdAt: { gte: dateFrom, lte: dateTo },
          assigneeId: { not: null },
        },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['reporterId'],
        where: { ...baseWhere, createdAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
      }),
      this.prisma.ticket.findMany({
        where: periodResolvedWhere,
        select: { createdAt: true, resolvedAt: true },
      }),
      this.prisma.ticket.findMany({
        where: {
          ...baseWhere,
          OR: [
            { createdAt: { gte: dateFrom, lte: dateTo } },
            { resolvedAt: { gte: dateFrom, lte: dateTo } },
          ],
        },
        select: { createdAt: true, resolvedAt: true },
      }),
      this.prisma.ticketHistory.findMany({
        where: {
          eventType: HistoryEventType.STATUS_CHANGED,
          newStatus: TicketStatus.IN_PROGRESS,
          ticket: baseWhere,
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        select: {
          ticketId: true,
          createdAt: true,
          ticket: { select: { createdAt: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const avgResolutionHours = this.avgHours(
      resolvedTickets
        .filter((t) => t.resolvedAt)
        .map((t) => t.resolvedAt!.getTime() - t.createdAt.getTime()),
    );

    const slaCompliant = resolvedTickets.filter((t) => {
      if (!t.resolvedAt) return false;
      const hours = (t.resolvedAt.getTime() - t.createdAt.getTime()) / 3_600_000;
      return hours <= slaTargetHours;
    }).length;

    const slaComplianceRate =
      resolvedTickets.length > 0
        ? Math.round((slaCompliant / resolvedTickets.length) * 100)
        : null;

    const firstResponseByTicket = new Map<string, number>();
    for (const entry of firstResponseEntries) {
      if (!firstResponseByTicket.has(entry.ticketId)) {
        firstResponseByTicket.set(
          entry.ticketId,
          entry.createdAt.getTime() - entry.ticket.createdAt.getTime(),
        );
      }
    }

    const avgFirstResponseHours = this.avgHours(
      [...firstResponseByTicket.values()],
    );

    const areaIds = byAreaRaw
      .map((r) => r.areaId)
      .filter((id): id is string => id !== null);
    const userIds = [
      ...new Set([
        ...byAssigneeRaw.map((r) => r.assigneeId).filter(Boolean),
        ...byReporterRaw.map((r) => r.reporterId),
      ]),
    ] as string[];

    const [areas, users, assigneeResolved] = await Promise.all([
      areaIds.length
        ? this.prisma.area.findMany({
            where: { id: { in: areaIds } },
            select: { id: true, name: true },
          })
        : [],
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : [],
      this.getAssigneeResolvedStats(baseWhere, dateFrom, dateTo),
    ]);

    const areaMap = new Map(areas.map((a) => [a.id, a.name]));
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return {
      data: {
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
        },
        kpis: {
          created,
          resolved,
          cancelled,
          openBacklog,
          inProgress,
          pending,
          highPriorityOpen,
          criticalSeverityOpen,
          resolutionRate:
            created > 0 ? Math.round((resolved / created) * 100) : 0,
          cancellationRate:
            created > 0 ? Math.round((cancelled / created) * 100) : 0,
          avgResolutionHours,
          avgFirstResponseHours,
          slaComplianceRate,
          slaTargetHours,
        },
        byStatus: byStatus.map((r) => ({
          status: r.status,
          count: r._count,
        })),
        byCategory: byCategory.map((r) => ({
          category: r.category,
          count: r._count,
        })),
        byPriority: byPriority.map((r) => ({
          priority: r.priority,
          count: r._count,
        })),
        bySeverity: bySeverity.map((r) => ({
          severity: r.severity,
          count: r._count,
        })),
        byArea: byAreaRaw.map((r) => ({
          areaId: r.areaId,
          areaName: r.areaId ? (areaMap.get(r.areaId) ?? 'Sin área') : 'Sin área',
          count: r._count,
        })),
        byTechnician: await this.buildTechnicianMetrics(
          byAssigneeRaw,
          userMap,
          assigneeResolved,
        ),
        byReporter: byReporterRaw
          .map((r) => ({
            userId: r.reporterId,
            userName: userMap.get(r.reporterId) ?? 'Desconocido',
            count: r._count,
          }))
          .sort((a, b) => b.count - a.count),
        trends: this.buildTrends(trendTickets, dateFrom, dateTo),
      },
    };
  }

  async exportExcel(user: JwtPayload, query: ReportQueryDto) {
    const { data } = await this.getMetrics(user, query);
    const buffer = await buildReportsExcel(data);
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      buffer,
      filename: `fixdesk-reportes-${stamp}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  async exportPdf(user: JwtPayload, query: ReportQueryDto) {
    const { data } = await this.getMetrics(user, query);
    const buffer = await buildReportsPdf(data);
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      buffer,
      filename: `fixdesk-reportes-${stamp}.pdf`,
      contentType: 'application/pdf',
    };
  }

  async getFilterOptions(user: JwtPayload) {
    const scope = this.buildScopeWhere(user);

    const [areas, assigneeIds, reporterIds] = await Promise.all([
      this.prisma.area.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.ticket.findMany({
        where: { ...scope, assigneeId: { not: null } },
        select: { assigneeId: true },
        distinct: ['assigneeId'],
      }),
      this.prisma.ticket.findMany({
        where: scope,
        select: { reporterId: true },
        distinct: ['reporterId'],
      }),
    ]);

    const technicianUserIds = assigneeIds
      .map((r) => r.assigneeId)
      .filter((id): id is string => id !== null);

    const reporterUserIds = reporterIds.map((r) => r.reporterId);

    const allUserIds = [...new Set([...technicianUserIds, ...reporterUserIds])];

    const users = allUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, name: true, role: true },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      data: {
        areas,
        technicians: technicianUserIds
          .map((id) => userMap.get(id))
          .filter((u): u is NonNullable<typeof u> => !!u),
        reporters: reporterUserIds
          .map((id) => userMap.get(id))
          .filter((u): u is NonNullable<typeof u> => !!u),
      },
    };
  }

  private async getAssigneeResolvedStats(
    baseWhere: Prisma.TicketWhereInput,
    dateFrom: Date,
    dateTo: Date,
  ) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: {
        ...baseWhere,
        status: TicketStatus.RESOLVED,
        assigneeId: { not: null },
        resolvedAt: { gte: dateFrom, lte: dateTo },
      },
      _count: true,
    });

    const resolvedWithTimes = await this.prisma.ticket.findMany({
      where: {
        ...baseWhere,
        status: TicketStatus.RESOLVED,
        assigneeId: { not: null },
        resolvedAt: { gte: dateFrom, lte: dateTo },
      },
      select: { assigneeId: true, createdAt: true, resolvedAt: true },
    });

    const timesByAssignee = new Map<string, number[]>();
    for (const t of resolvedWithTimes) {
      if (!t.assigneeId || !t.resolvedAt) continue;
      const hours =
        (t.resolvedAt.getTime() - t.createdAt.getTime()) / 3_600_000;
      const list = timesByAssignee.get(t.assigneeId) ?? [];
      list.push(hours);
      timesByAssignee.set(t.assigneeId, list);
    }

    return { counts: rows, timesByAssignee };
  }

  private async buildTechnicianMetrics(
    byAssigneeRaw: { assigneeId: string | null; _count: number }[],
    userMap: Map<string, string>,
    assigneeResolved: {
      counts: { assigneeId: string | null; _count: number }[];
      timesByAssignee: Map<string, number[]>;
    },
  ) {
    const resolvedMap = new Map(
      assigneeResolved.counts.map((r) => [r.assigneeId, r._count]),
    );

    return byAssigneeRaw
      .filter((r) => r.assigneeId)
      .map((r) => {
        const times = assigneeResolved.timesByAssignee.get(r.assigneeId!) ?? [];
        const avgHours =
          times.length > 0
            ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) /
              10
            : null;

        return {
          userId: r.assigneeId!,
          userName: userMap.get(r.assigneeId!) ?? 'Sin asignar',
          assigned: r._count,
          resolved: resolvedMap.get(r.assigneeId!) ?? 0,
          avgResolutionHours: avgHours,
        };
      })
      .sort((a, b) => b.assigned - a.assigned);
  }

  private buildTrends(
    tickets: { createdAt: Date; resolvedAt: Date | null }[],
    dateFrom: Date,
    dateTo: Date,
  ) {
    const days = this.eachDay(dateFrom, dateTo);
    const createdMap = new Map(days.map((d) => [d, 0]));
    const resolvedMap = new Map(days.map((d) => [d, 0]));

    for (const t of tickets) {
      const createdKey = this.toDateKey(t.createdAt);
      if (createdMap.has(createdKey)) {
        createdMap.set(createdKey, (createdMap.get(createdKey) ?? 0) + 1);
      }
      if (t.resolvedAt) {
        const resolvedKey = this.toDateKey(t.resolvedAt);
        if (resolvedMap.has(resolvedKey)) {
          resolvedMap.set(resolvedKey, (resolvedMap.get(resolvedKey) ?? 0) + 1);
        }
      }
    }

    return days.map((date) => ({
      date,
      created: createdMap.get(date) ?? 0,
      resolved: resolvedMap.get(date) ?? 0,
    }));
  }

  private eachDay(from: Date, to: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    while (cursor <= end) {
      days.push(this.toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  private toDateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private avgHours(durationsMs: number[]): number | null {
    if (!durationsMs.length) return null;
    const avgMs =
      durationsMs.reduce((sum, ms) => sum + ms, 0) / durationsMs.length;
    return Math.round((avgMs / 3_600_000) * 10) / 10;
  }

  private resolveDateRange(query: ReportQueryDto) {
    const now = new Date();
    const defaultTo = new Date(now);
    defaultTo.setHours(23, 59, 59, 999);

    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    defaultFrom.setHours(0, 0, 0, 0);

    const dateFrom = query.dateFrom
      ? new Date(`${query.dateFrom}T00:00:00.000Z`)
      : defaultFrom;
    const dateTo = query.dateTo
      ? (() => {
          const d = new Date(`${query.dateTo}T23:59:59.999Z`);
          return d;
        })()
      : defaultTo;

    return { dateFrom, dateTo };
  }

  private buildScopeWhere(user: JwtPayload): Prisma.TicketWhereInput {
    if (user.role === Role.ADMIN) return {};

    if (user.role === Role.USER) {
      return { reporterId: user.sub };
    }

    return {
      OR: [
        { assigneeId: user.sub },
        { area: { technicians: { some: { id: user.sub } } } },
        { reporterId: user.sub },
      ],
    };
  }

  private buildFilterWhere(
    user: JwtPayload,
    query: ReportQueryDto,
  ): Prisma.TicketWhereInput {
    const and: Prisma.TicketWhereInput[] = [this.buildScopeWhere(user)];

    if (query.category) and.push({ category: query.category });
    if (query.status) and.push({ status: query.status });
    if (query.priority) and.push({ priority: query.priority });
    if (query.severity) and.push({ severity: query.severity });
    if (query.areaId) and.push({ areaId: query.areaId });
    if (query.assigneeId) and.push({ assigneeId: query.assigneeId });
    if (query.reporterId) and.push({ reporterId: query.reporterId });

    return and.length === 1 ? and[0] : { AND: and };
  }
}
