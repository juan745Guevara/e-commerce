import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PublicUser } from '../../domain/entities/user.entity.js';
import type { IUserRepository } from '../../domain/interfaces/user-repository.interface.js';
import { USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';

export type AuthTokenResponse = {
  accessToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email,
      passwordHash,
      role: 'cliente',
      phone: dto.phone?.trim() || null,
    });

    return user.toPublic();
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: user.toPublic(),
    };
  }

  async validateUser(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user.toPublic();
  }
}
