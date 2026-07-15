import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { area: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { area: true },
    });
  }

  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
    areaId?: string;
  }) {
    return this.prisma.user.create({
      data,
      include: { area: true },
    });
  }
}
