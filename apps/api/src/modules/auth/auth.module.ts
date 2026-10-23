import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '../../config/config.module';
import { AppConfigService } from '../../config/app-config.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    AuditModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtAccessSecret,
        signOptions: { expiresIn: config.jwtAccessTtl as unknown as number },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
