import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TicketCategory, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  location: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  /** URL real o marcador `placeholder:<nombre-archivo>` (sin storage). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^(https?:\/\/\S+|placeholder:.+)$/i, {
    message: 'photoUrl debe ser URL http(s) o placeholder:<archivo>',
  })
  photoUrl?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  labelIds?: string[];
}
