import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type BillingMode = 'disabled' | 'simulation' | 'live';

/**
 * Le lot 3 (entitlements) doit être livré avant d'autoriser un encaissement
 * réel. Tant que ce drapeau est faux, `BILLING_MODE=live` fait échouer le
 * démarrage : aucun paiement réel ne peut être activé par erreur.
 */
const ENTITLEMENTS_READY = false;

/** Longueur minimale exigée pour les secrets symétriques (256 bits en hex/base64). */
const MIN_SECRET_LENGTH = 32;

const SECRET_PLACEHOLDER_MARKERS = [
  'replace-with',
  'change-me',
  'changeme',
  'placeholder',
  'dev-access',
  'dev-refresh',
  'example-secret',
];

function readSecret(name: string): string {
  const value = (process.env[name] ?? '').trim();
  if (!value) {
    throw new Error(`${name} est obligatoire.`);
  }
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} doit contenir au moins ${MIN_SECRET_LENGTH} caractères.`);
  }
  const lower = value.toLowerCase();
  if (SECRET_PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker))) {
    throw new Error(`${name} utilise encore une valeur d’exemple : générez un secret aléatoire.`);
  }
  return value;
}

const DURATION_UNIT_MS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

/** Convertit une durée JWT (`15m`, `12h`, `7d`) en millisecondes. */
export function parseDurationMs(value: string, name: string): number {
  const match = /^(\d+)\s*([smhd])$/i.exec(value.trim());
  if (!match) {
    throw new Error(`${name} doit être une durée valide comme 15m, 12h ou 7d.`);
  }
  const amount = Number(match[1]);
  const unit = (match[2] ?? '').toLowerCase() as keyof typeof DURATION_UNIT_MS;
  const factor = DURATION_UNIT_MS[unit];
  if (!Number.isFinite(amount) || amount <= 0 || !factor) {
    throw new Error(`${name} doit être une durée positive comme 15m, 12h ou 7d.`);
  }
  return amount * factor;
}

@Injectable()
export class PrismaServiceClient extends PrismaService {}

@Injectable()
export class AppConfigService implements OnModuleInit {
  onModuleInit(): void {
    // Fail fast : une configuration de paiement invalide ne doit jamais
    // démarrer un serveur capable d'encaisser.
    void this.billingMode;
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL ?? '';
  }

  get jwtAccessSecret(): string {
    return readSecret('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return readSecret('JWT_REFRESH_SECRET');
  }

  get jwtAccessTtl(): string {
    return process.env.JWT_ACCESS_TTL ?? '15m';
  }

  get jwtRefreshTtl(): string {
    return process.env.JWT_REFRESH_TTL ?? '7d';
  }

  /** Durée de vie des jetons de rafraîchissement en millisecondes. */
  get jwtRefreshTtlMs(): number {
    return parseDurationMs(this.jwtRefreshTtl, 'JWT_REFRESH_TTL');
  }

  get emailVerificationTtlMinutes(): number {
    return Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? 60);
  }

  get passwordResetTtlMinutes(): number {
    return Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30);
  }

  get dataEncryptionKey(): string {
    const key = readSecret('DATA_ENCRYPTION_KEY');
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length !== 32) {
      throw new Error('DATA_ENCRYPTION_KEY doit être une clé Base64 de 32 octets.');
    }
    return key;
  }

  /**
   * Valide les secrets critiques avant de créer l'application. Appelée depuis
   * `main.ts` : si un secret manque, est trop court ou reste un exemple, le
   * processus s'arrête avant d'ouvrir le moindre port.
   */
  validateEnvironment(): void {
    const errors: string[] = [];

    for (const check of [
      () => this.jwtAccessSecret,
      () => this.jwtRefreshSecret,
      () => this.dataEncryptionKey,
      () => this.jwtRefreshTtlMs,
    ]) {
      try {
        check();
      } catch (error: unknown) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    if (errors.length === 0 && this.jwtAccessSecret === this.jwtRefreshSecret) {
      errors.push('JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration invalide :\n- ${errors.join('\n- ')}`);
    }
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

  get mailApiKey(): string | null {
    return process.env.RESEND_API_KEY ?? null;
  }

  get mailFrom(): string {
    return process.env.MAIL_FROM ?? 'ModelBénin <notifications@modelbenin.local>';
  }

  get appPublicUrl(): string {
    return (
      process.env.APP_PUBLIC_URL ??
      process.env.WEB_APP_URL ??
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  /**
   * Mode de facturation :
   * - `disabled` : aucun paiement, même simulé ;
   * - `simulation` : paiement simulé, aucun encaissement réel ;
   * - `live` : encaissement réel, interdit tant que les entitlements ne sont
   *   pas livrés (lot 3).
   */
  get billingMode(): BillingMode {
    const explicit = (process.env.BILLING_MODE ?? '').trim().toLowerCase();
    if (explicit) {
      if (explicit !== 'disabled' && explicit !== 'simulation' && explicit !== 'live') {
        throw new Error('BILLING_MODE doit valoir disabled, simulation ou live.');
      }
      if (explicit === 'live' && !ENTITLEMENTS_READY) {
        throw new Error(
          'BILLING_MODE=live est interdit tant que le lot 3 (entitlements) n’est pas validé.',
        );
      }
      return explicit;
    }

    // Rétrocompatibilité : on ne déduit jamais `live` d'une ancienne variable.
    if ((process.env.BILLING_PROVIDER ?? '').trim().toUpperCase() === 'FEDAPAY') {
      throw new Error(
        'BILLING_PROVIDER=FEDAPAY n’est plus supporté : définir BILLING_MODE (disabled, simulation ou live).',
      );
    }
    if (process.env.BILLING_SIMULATION === 'false') {
      return 'disabled';
    }
    return this.nodeEnv === 'production' ? 'disabled' : 'simulation';
  }

  get billingSimulationEnabled(): boolean {
    return this.billingMode === 'simulation';
  }

  get fedapaySecretKey(): string | null {
    const key = process.env.FEDAPAY_SECRET_KEY?.trim();
    return key ? key : null;
  }

  get fedapayWebhookSecret(): string | null {
    const secret = process.env.FEDAPAY_WEBHOOK_SECRET?.trim();
    return secret ? secret : null;
  }

  get fedapayApiUrl(): string {
    return (process.env.FEDAPAY_API_URL ?? 'https://api.fedapay.com/v1').replace(/\/+$/, '');
  }

  private requireValue(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} est obligatoire pour le stockage privé des photos.`);
    }
    return value;
  }
}
