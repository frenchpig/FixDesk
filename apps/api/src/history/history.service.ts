import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  HistoryEventType,
  TicketStatus,
  type Prisma,
} from '@prisma/client';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    ticketId: string;
    userId: string;
    eventType: HistoryEventType;
    oldStatus?: TicketStatus;
    newStatus?: TicketStatus;
    note?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.ticketHistory.create({
      data,
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  findByTicketId(ticketId: string) {
    return this.prisma.ticketHistory.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}
