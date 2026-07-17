// Responsabilidad: DTOs del CRUD de estados de workflow y ajustes globales
// Usado por: SettingsController (POST/PATCH/DELETE /settings/workflow*)
// NO hace: validación de negocio (consistencia de estados en SettingsService)
//
// No existe nest g dto en este proyecto; archivo creado como excepción justificada.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { StatusSemantic } from '@prisma/client';

const BADGE_VARIANTS = [
  'default',
  'primary',
  'success',
  'warning',
  'danger',
] as const;

export class CreateWorkflowStateDto {
  @ApiProperty({ example: 'En revisión' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  label: string;

  @ApiProperty({ enum: StatusSemantic })
  @IsEnum(StatusSemantic)
  semantic: StatusSemantic;

  @ApiPropertyOptional({ enum: BADGE_VARIANTS })
  @IsOptional()
  @IsIn(BADGE_VARIANTS)
  badgeVariant?: (typeof BADGE_VARIANTS)[number];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  kanban?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  finalized?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  noteRequiredOnEnter?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Keys destino' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedTargets?: string[];
}

export class UpdateWorkflowStateDto {
  @ApiPropertyOptional({ example: 'En revisión' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  label?: string;

  @ApiPropertyOptional({ enum: StatusSemantic })
  @IsOptional()
  @IsEnum(StatusSemantic)
  semantic?: StatusSemantic;

  @ApiPropertyOptional({ enum: BADGE_VARIANTS })
  @IsOptional()
  @IsIn(BADGE_VARIANTS)
  badgeVariant?: (typeof BADGE_VARIANTS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  kanban?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  finalized?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  noteRequiredOnEnter?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Keys destino' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedTargets?: string[];

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({
    description: 'Exigir nota al salir de un estado finalizado',
  })
  @IsOptional()
  @IsBoolean()
  workflowNoteOnReopen?: boolean;

  @ApiPropertyOptional({
    description: 'Key del estado default para tickets nuevos',
  })
  @IsOptional()
  @IsString()
  defaultStateKey?: string;
}
