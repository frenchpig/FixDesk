import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'node:path';
import { AppController } from './app.controller';
import {
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  resolvePositiveInteger,
} from './config/throttling.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { HistoryModule } from './history/history.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LabelsModule } from './labels/labels.module';
import { SettingsModule } from './settings/settings.module';
import { WorkflowModule } from './workflow/workflow.module';

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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: resolvePositiveInteger(
            config.get<string>('THROTTLE_TTL_MS'),
            DEFAULT_THROTTLE_TTL_MS,
            'THROTTLE_TTL_MS',
          ),
          limit: resolvePositiveInteger(
            config.get<string>('THROTTLE_LIMIT'),
            DEFAULT_THROTTLE_LIMIT,
            'THROTTLE_LIMIT',
          ),
        },
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
    SettingsModule,
    WorkflowModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
