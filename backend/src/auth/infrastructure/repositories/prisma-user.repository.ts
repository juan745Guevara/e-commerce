import { Injectable } from '@nestjs/common';
import { Role, User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { User } from '../../domain/entities/user.entity.js';
import {
  CreateUserData,
  IUserRepository,
} from '../../domain/interfaces/user-repository.interface.js';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role as Role,
        phone: data.phone ?? null,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaUser): User {
    return new User(
      row.id,
      row.email,
      row.passwordHash,
      row.role,
      row.phone,
      row.createdAt,
    );
  }
}
