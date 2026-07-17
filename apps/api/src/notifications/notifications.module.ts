import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRealtimeGateway } from './notifications-realtime/notifications-realtime.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [NotificationsService, NotificationsRealtimeGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationsRealtimeGateway],
})
export class NotificationsModule {}
