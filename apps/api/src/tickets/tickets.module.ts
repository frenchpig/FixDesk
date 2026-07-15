import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { HistoryModule } from '../history/history.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [HistoryModule, NotificationsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
