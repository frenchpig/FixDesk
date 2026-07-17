// Responsabilidad: endpoints HTTP de configuración del sistema (SLA + workflow)
// Usado por: AppModule via SettingsModule
// NO hace: lógica de negocio de reportería

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSlaDto } from './dto/update-sla.dto';
import {
  CreateWorkflowStateDto,
  UpdateWorkflowDto,
  UpdateWorkflowStateDto,
} from './dto/update-workflow.dto';
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
  @ApiOperation({
    summary: 'Listar estados del workflow (incluye inactivos) + ajustes',
  })
  getWorkflow() {
    return this.settingsService.getWorkflowSettings();
  }

  @Patch('workflow')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Ajustes globales: nota al reabrir y estado default (solo admin)',
  })
  updateWorkflow(@Body() dto: UpdateWorkflowDto, @Req() req: RequestWithUser) {
    return this.settingsService.updateWorkflowGlobal(dto, req.user.sub);
  }

  @Post('workflow/states')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear estado de workflow (solo admin)' })
  createWorkflowState(@Body() dto: CreateWorkflowStateDto) {
    return this.settingsService.createWorkflowState(dto);
  }

  @Patch('workflow/states/:key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Editar estado de workflow (solo admin)' })
  @ApiParam({ name: 'key', description: 'Key del estado' })
  updateWorkflowState(
    @Param('key') key: string,
    @Body() dto: UpdateWorkflowStateDto,
  ) {
    return this.settingsService.updateWorkflowState(key, dto);
  }

  @Delete('workflow/states/:key')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Eliminar estado (se desactiva si tiene tickets) (solo admin)',
  })
  @ApiParam({ name: 'key', description: 'Key del estado' })
  deleteWorkflowState(@Param('key') key: string) {
    return this.settingsService.deleteWorkflowState(key);
  }
}
