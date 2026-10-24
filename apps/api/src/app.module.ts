import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from './common/guards/email-verified.guard';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PhotosModule } from './modules/photos/photos.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RateLimitModule,
    ProfilesModule,
    PhotosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EmailVerifiedGuard,
    },
  ],
})
export class AppModule {}
