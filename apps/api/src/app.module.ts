import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { HistoryModule } from './history/history.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LabelsModule } from './labels/labels.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // Carga fiable aunque el proceso arranque desde la raíz del monorepo
        join(__dirname, '..', '..', '.env'),
        '.env',
      ],
    }),
    PrismaModule,
    AuthModule,
    TicketsModule,
    HistoryModule,
    UsersModule,
    ReportsModule,
    NotificationsModule,
    LabelsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
