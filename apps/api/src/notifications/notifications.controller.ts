import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SWAGGER_BEARER } from '../swagger';
import type { RequestWithUser } from '../auth/types/request-with-user';

@ApiTags('Notifications')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  findAll(
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.notificationsService.findAll(
      req.user.sub,
      page ? Number(page) : undefined,
      perPage ? Number(perPage) : undefined,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contador de notificaciones no leídas' })
  unreadCount(@Req() req: RequestWithUser) {
    return this.notificationsService.unreadCount(req.user.sub);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  markAllRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  markRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.notificationsService.markRead(id, req.user.sub);
  }
}
