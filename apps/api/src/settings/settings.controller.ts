// Responsabilidad: endpoints HTTP de configuración del sistema (SLA + workflow)
// Usado por: AppModule via SettingsModule
// NO hace: lógica de negocio de reportería

import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSlaDto } from './dto/update-sla.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SWAGGER_BEARER } from '../swagger';
import type { RequestWithUser } from '../auth/types/request-with-user';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('sla')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Obtener umbral SLA actual (horas)' })
  getSla() {
    return this.settingsService.getSlaSettings();
  }

  @Patch('sla')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar umbral SLA (solo admin)' })
  updateSla(@Body() dto: UpdateSlaDto, @Req() req: RequestWithUser) {
    return this.settingsService.updateSlaTargetHours(
      dto.slaTargetHours,
      req.user.sub,
    );
  }

  @Get('workflow')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Obtener definición de workflow editable' })
  getWorkflow() {
    return this.settingsService.getWorkflowSettings();
  }

  @Patch('workflow')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar definición de workflow (solo admin)' })
  updateWorkflow(@Body() dto: UpdateWorkflowDto, @Req() req: RequestWithUser) {
    return this.settingsService.updateWorkflowConfig(dto, req.user.sub);
  }
}
