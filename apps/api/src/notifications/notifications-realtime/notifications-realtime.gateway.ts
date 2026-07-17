// Responsabilidad: gateway Socket.IO de notificaciones en tiempo real
// Usado por: NotificationsService (emit), NotificationsModule
// NO hace: persistir notificaciones ni REST

import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../../auth/types/jwt-payload';

export interface NotificationRealtimePayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  ticketId?: string | null;
  readAt?: Date | string | null;
  createdAt: Date | string;
}

export interface TicketEventPayload {
  ticketId: string;
  action: string;
  reporterId: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsRealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }

      client.data.userId = payload.sub;
      await client.join(this.userRoom(payload.sub));
      if (payload.role === Role.TECHNICIAN || payload.role === Role.ADMIN) {
        await client.join(this.staffRoom());
      }
      this.logger.debug(`WS connected user=${payload.sub} sid=${client.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.logger.debug(`WS disconnected user=${userId} sid=${client.id}`);
    }
  }

  /**
   * Emite una notificación nueva a la room del destinatario.
   */
  emitNotification(notification: NotificationRealtimePayload) {
    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? null,
      ticketId: notification.ticketId ?? null,
      readAt: notification.readAt
        ? new Date(notification.readAt).toISOString()
        : null,
      createdAt: new Date(notification.createdAt).toISOString(),
    };

    this.server
      .to(this.userRoom(notification.userId))
      .emit('notification:new', payload);
  }

  /**
   * Emite un cambio de ticket al staff y al reportero. Solo envía IDs;
   * cada cliente refetchea su endpoint (el servidor re-aplica permisos).
   */
  emitTicketEvent(event: TicketEventPayload) {
    this.server
      .to(this.staffRoom())
      .to(this.userRoom(event.reporterId))
      .emit('ticket:changed', {
        ticketId: event.ticketId,
        action: event.action,
      });
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private staffRoom() {
    return 'staff';
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return fromAuth;
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length).trim();
    }

    return null;
  }
}
