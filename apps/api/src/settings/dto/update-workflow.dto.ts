// Responsabilidad: DTO para actualizar la definición de workflow del sistema
// Usado por: SettingsController (PATCH /settings/workflow)
// NO hace: validación de negocio (assertValidWorkflowConfig en el service)
//
// No existe nest g dto en este proyecto; archivo creado como excepción justificada.

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsObject,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TicketStatus } from '@prisma/client';

const BADGE_VARIANTS = [
  'default',
  'primary',
  'success',
  'warning',
  'danger',
] as const;

class WorkflowStateDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  id: TicketStatus;

  @ApiProperty({ example: 'Abierto' })
  @IsString()
  @MinLength(1)
  label: string;

  @ApiProperty()
  @IsBoolean()
  finalized: boolean;

  @ApiProperty()
  @IsBoolean()
  kanban: boolean;

  @ApiProperty({ enum: BADGE_VARIANTS })
  @IsIn(BADGE_VARIANTS)
  badgeVariant: (typeof BADGE_VARIANTS)[number];
}

class WorkflowNoteRequiredDto {
  @ApiProperty({ enum: TicketStatus, isArray: true })
  @IsArray()
  @IsEnum(TicketStatus, { each: true })
  entering: TicketStatus[];

  @ApiProperty()
  @IsBoolean()
  leavingFinalized: boolean;
}

export class UpdateWorkflowDto {
  @ApiProperty({ type: [WorkflowStateDto] })
  @IsArray()
  @ArrayMinSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStateDto)
  states: WorkflowStateDto[];

  @ApiProperty({
    description: 'Mapa estado → estados destino permitidos',
    example: { OPEN: ['IN_PROGRESS', 'PENDING'] },
  })
  @IsObject()
  transitions: Record<string, TicketStatus[]>;

  @ApiProperty({ type: WorkflowNoteRequiredDto })
  @ValidateNested()
  @Type(() => WorkflowNoteRequiredDto)
  noteRequired: WorkflowNoteRequiredDto;
}
