import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {
  AddNoteDto,
  AssignTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
} from './dto/update-ticket.dto';
import { SetTicketLabelsDto } from '../labels/dto/set-ticket-labels.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, TicketCategory, TicketStatus } from '@prisma/client';
import { SWAGGER_BEARER } from '../swagger';
import type { RequestWithUser } from '../auth/types/request-with-user';

@ApiTags('Tickets')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(Role.USER, Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Crear ticket' })
  create(@Body() dto: CreateTicketDto, @Req() req: RequestWithUser) {
    return this.ticketsService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets (filtrado por rol)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'category', required: false, enum: TicketCategory })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'resolvedToday', required: false, type: Boolean })
  @ApiQuery({ name: 'createdToday', required: false, type: Boolean })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda en título/descripción' })
  @ApiQuery({ name: 'labelId', required: false, description: 'Filtrar por etiqueta' })
  findAll(
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: string,
    @Query('category') category?: TicketCategory,
    @Query('assigneeId') assigneeId?: string,
    @Query('resolvedToday') resolvedToday?: string,
    @Query('createdToday') createdToday?: string,
    @Query('q') q?: string,
    @Query('labelId') labelId?: string,
  ) {
    return this.ticketsService.findAll(req.user, {
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      status,
      priority,
      category,
      assigneeId,
      resolvedToday: resolvedToday === 'true',
      createdToday: createdToday === 'true',
      q,
      labelId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ticketsService.findOne(id, req.user);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Historial / audit log del ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  getHistory(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ticketsService.getHistory(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({
    summary:
      'Editar campos del ticket (título, descripción, categoría, ubicación, prioridad)',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.update(id, dto, req.user);
  }

  @Patch(':id/status')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado del ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.updateStatus(id, dto, req.user);
  }

  @Patch(':id/assign')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Asignar ticket a un técnico' })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.assign(id, dto, req.user);
  }

  @Post(':id/notes')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Agregar comentario / nota técnica' })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.addNote(id, dto, req.user);
  }

  @Patch(':id/labels')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @ApiOperation({ summary: 'Reemplazar etiquetas del ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  setLabels(
    @Param('id') id: string,
    @Body() dto: SetTicketLabelsDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.setLabels(id, dto.labelIds, req.user);
  }
}
