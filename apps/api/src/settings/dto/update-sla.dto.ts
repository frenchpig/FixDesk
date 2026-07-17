// Responsabilidad: DTO para actualizar el umbral SLA del sistema
// Usado por: SettingsController (PATCH /settings/sla)
// NO hace: leer settings ni calcular métricas

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateSlaDto {
  @ApiProperty({
    description: 'Horas objetivo de resolución (SLA)',
    minimum: 1,
    maximum: 720,
    example: 48,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  slaTargetHours: number;
}
