import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types/request-with-user';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
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
  unreadCount(@Req() req: RequestWithUser) {
    return this.notificationsService.unreadCount(req.user.sub);
  }

  @Patch('read-all')
  markAllRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.notificationsService.markRead(id, req.user.sub);
  }
}
