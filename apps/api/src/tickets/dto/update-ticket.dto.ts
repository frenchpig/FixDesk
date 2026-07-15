import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketStatus } from '@prisma/client';

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
