import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaServiceClient extends PrismaService {}

@Injectable()
export class AppConfigService {
  get databaseUrl(): string {
    return process.env.DATABASE_URL ?? '';
  }

  get jwtAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';
  }

  get jwtRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me';
  }

  get jwtAccessTtl(): string {
    return process.env.JWT_ACCESS_TTL ?? '15m';
  }

  get jwtRefreshTtl(): string {
    return process.env.JWT_REFRESH_TTL ?? '7d';
  }

  get emailVerificationTtlMinutes(): number {
    return Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? 60);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  }
}
