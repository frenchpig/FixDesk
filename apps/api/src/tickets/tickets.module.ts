import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { HistoryModule } from '../history/history.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LabelsModule } from '../labels/labels.module';

@Module({
  imports: [HistoryModule, NotificationsModule, LabelsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
