import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SWAGGER_BEARER } from '../swagger';

@ApiTags('Labels')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('labels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar etiquetas disponibles' })
  async findAll() {
    const data = await this.labelsService.findAll();
    return { data };
  }

  @Post()
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Crear etiqueta (técnico/admin)' })
  create(@Body() dto: CreateLabelDto) {
    return this.labelsService.create(dto);
  }
}
