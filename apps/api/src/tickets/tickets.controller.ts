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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {
  AddNoteDto,
  AssignTicketDto,
  UpdateTicketStatusDto,
} from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, TicketCategory, TicketStatus } from '@prisma/client';
import type { RequestWithUser } from '../auth/types/request-with-user';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(Role.USER, Role.TECHNICIAN, Role.ADMIN)
  create(@Body() dto: CreateTicketDto, @Req() req: RequestWithUser) {
    return this.ticketsService.create(dto, req.user);
  }

  @Get()
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
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ticketsService.findOne(id, req.user);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ticketsService.getHistory(id, req.user);
  }

  @Patch(':id/status')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.updateStatus(id, dto, req.user);
  }

  @Patch(':id/assign')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.assign(id, dto, req.user);
  }

  @Post(':id/notes')
  @Roles(Role.TECHNICIAN, Role.ADMIN)
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.addNote(id, dto, req.user);
  }
}
