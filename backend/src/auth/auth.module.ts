import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { USER_REPOSITORY } from './domain/interfaces/user-repository.interface.js';
import { AuthService } from './application/services/auth.service.js';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { AuthController } from './presentation/auth.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [AuthService, JwtModule, PassportModule, USER_REPOSITORY],
})
export class AuthModule {}
