import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { RequestWithUser } from '../auth/types/request-with-user';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TECHNICIAN, Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('metrics')
  getMetrics(@Query() query: ReportQueryDto, @Req() req: RequestWithUser) {
    return this.reportsService.getMetrics(req.user, query);
  }

  @Get('filters')
  getFilterOptions(@Req() req: RequestWithUser) {
    return this.reportsService.getFilterOptions(req.user);
  }
}
