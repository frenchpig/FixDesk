import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SettingsModule } from '../settings/settings.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [SettingsModule, WorkflowModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
