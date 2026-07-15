// Responsabilidad: catálogo de etiquetas (CRUD básico)
// Usado por: LabelsController, TicketsService (validación de IDs)
// NO hace: asignación a tickets (eso vive en TicketsService)
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.label.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true },
    });
  }

  async create(dto: CreateLabelDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.label.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException('Ya existe una etiqueta con ese nombre');
    }

    const label = await this.prisma.label.create({
      data: {
        name,
        color: dto.color ?? '#64748B',
      },
      select: { id: true, name: true, color: true },
    });

    return { data: label };
  }

  async assertLabelsExist(labelIds: string[]) {
    if (!labelIds.length) return;
    const unique = [...new Set(labelIds)];
    const count = await this.prisma.label.count({
      where: { id: { in: unique } },
    });
    if (count !== unique.length) {
      throw new NotFoundException('Una o más etiquetas no existen');
    }
  }
}
