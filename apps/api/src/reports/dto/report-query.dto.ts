import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketCategory, TicketPriority, TicketSeverity } from '@prisma/client';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  reporterId?: string;
}
