import {
  Controller,
  Get,
  Header,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SWAGGER_BEARER } from '../swagger';
import type { RequestWithUser } from '../auth/types/request-with-user';

@ApiTags('Reports')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TECHNICIAN, Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Métricas y KPIs del dashboard de reportes' })
  getMetrics(@Query() query: ReportQueryDto, @Req() req: RequestWithUser) {
    return this.reportsService.getMetrics(req.user, query);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Opciones de filtros para reportes' })
  getFilterOptions(@Req() req: RequestWithUser) {
    return this.reportsService.getFilterOptions(req.user);
  }

  @Get('export/excel')
  @ApiOperation({
    summary: 'Exportar métricas a Excel (.xlsx) con formato de marca',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportExcel(
    @Query() query: ReportQueryDto,
    @Req() req: RequestWithUser,
  ) {
    const file = await this.reportsService.exportExcel(req.user, query);
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Get('export/pdf')
  @ApiOperation({
    summary: 'Exportar métricas a PDF con diseño de reporte',
  })
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPdf(@Query() query: ReportQueryDto, @Req() req: RequestWithUser) {
    const file = await this.reportsService.exportPdf(req.user, query);
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename="${file.filename}"`,
    });
  }
}
