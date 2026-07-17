// Responsabilidad: persistir notificaciones in-app y emitirlas por websocket
// Usado por: NotificationsController, TicketsService
// NO hace: email ni push
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationsRealtimeGateway } from './notifications-realtime/notifications-realtime.gateway';

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  body?: string;
  ticketId?: string;
  actorId: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: NotificationsRealtimeGateway,
  ) {}

  /**
   * Crea notificaciones para destinatarios únicos, excluyendo al actor,
   * y emite cada una por websocket.
   */
  async createForUsers(
    userIds: string[],
    payload: CreateNotificationPayload,
  ) {
    const recipients = [
      ...new Set(userIds.filter((id) => id && id !== payload.actorId)),
    ];

    if (recipients.length === 0) return { created: 0 };

    const created = await Promise.all(
      recipients.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            ticketId: payload.ticketId,
          },
          select: {
            id: true,
            userId: true,
            type: true,
            title: true,
            body: true,
            ticketId: true,
            readAt: true,
            createdAt: true,
          },
        }),
      ),
    );

    for (const row of created) {
      this.realtimeGateway.emitNotification(row);
    }

    return { created: created.length };
  }

  async findAll(userId: string, page = 1, perPage = 20) {
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(50, Math.max(1, perPage));
    const where = { userId };

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePerPage,
        take: safePerPage,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          ticketId: true,
          readAt: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page: safePage,
        perPage: safePerPage,
        totalPages: Math.ceil(total / safePerPage) || 1,
      },
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('No puedes modificar esta notificación');
    }

    if (notification.readAt) {
      return { data: notification };
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return { data: updated };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
