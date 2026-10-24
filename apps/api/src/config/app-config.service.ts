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

  get dataEncryptionKey(): string {
    const key = process.env.DATA_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('DATA_ENCRYPTION_KEY est obligatoire pour traiter les données de profil sensibles.');
    }
    return key;
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  }
}
