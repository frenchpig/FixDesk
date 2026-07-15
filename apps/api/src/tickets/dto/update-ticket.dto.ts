import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  TicketCategory,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
} from '@prisma/client';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class AssignTicketDto {
  @IsOptional()
  @IsString()
  assigneeId?: string;
}

export class AddNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note: string;
}

/** Campos editables del ticket (excluye status, assign, labels). */
export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;
}
