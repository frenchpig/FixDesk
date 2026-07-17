// Responsabilidad: endpoints HTTP de definición de workflow de tickets
// Usado por: AppModule via WorkflowModule
// NO hace: mutar estados ni settings
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SWAGGER_BEARER } from '../swagger';

@ApiTags('Workflow')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('workflow')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener definición de workflow (estados, transiciones, notas)',
  })
  getWorkflow() {
    return this.workflowService.getWorkflow();
  }
}
