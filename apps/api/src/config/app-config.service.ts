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

  get s3Endpoint(): string {
    return this.requireValue('S3_ENDPOINT');
  }

  get s3Region(): string {
    return this.requireValue('S3_REGION');
  }

  get s3Bucket(): string {
    return this.requireValue('S3_BUCKET');
  }

  get s3AccessKeyId(): string {
    return this.requireValue('S3_ACCESS_KEY_ID');
  }

  get s3SecretAccessKey(): string {
    return this.requireValue('S3_SECRET_ACCESS_KEY');
  }

  get photoMaxBytes(): number {
    return 5 * 1024 * 1024;
  }

  get photoSignedUrlTtlSeconds(): number {
    return 300;
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  }

  private requireValue(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} est obligatoire pour le stockage privé des photos.`);
    }
    return value;
  }
}
