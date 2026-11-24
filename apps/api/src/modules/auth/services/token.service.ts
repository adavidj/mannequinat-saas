import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../../config/app-config.service';
import { FieldEncryptionService } from '../../../common/crypto/field-encryption.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * Fenêtre pendant laquelle un jeton déjà tourné peut être présenté à nouveau
 * sans être considéré comme volé. Elle couvre les requêtes parallèles d'un
 * même navigateur (onglets, préchargements) qui partagent le même cookie.
 */
export const REFRESH_REUSE_GRACE_MS = 60_000;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function randomToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
  ) {}

  async issueEmailVerification(userId: string): Promise<string> {
    const token = randomToken();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + this.config.emailVerificationTtlMinutes * 60_000);
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
    return token;
  }

  async verifyEmailToken(token: string): Promise<{ userId: string } | null> {
    const tokenHash = sha256(token);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return null;
    }
    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return { userId: record.userId };
  }

  async issuePasswordReset(userId: string): Promise<string> {
    const token = randomToken();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + this.config.passwordResetTtlMinutes * 60_000);

    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return token;
  }

  async consumePasswordResetToken(token: string): Promise<{ userId: string } | null> {
    const tokenHash = sha256(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return null;
    }
    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return { userId: record.userId };
  }

  async issueRefreshToken(userId: string, familyId: string = crypto.randomUUID()): Promise<string> {
    const token = randomToken();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + this.config.jwtRefreshTtlMs);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        familyId,
      },
    });
    return token;
  }

  /**
   * Jeton de remplacement encore valide dans la fenêtre de grâce. Stocké
   * chiffré pour rester utilisable par une requête parallèle, jamais en clair.
   */
  private benignReplacement(
    record: {
      revokedAt: Date | null;
      replacedAt: Date | null;
      replacedByTokenEncrypted: string | null;
    },
    now: Date,
  ): string | null {
    if (!record.revokedAt || !record.replacedAt || !record.replacedByTokenEncrypted) {
      return null;
    }
    if (now.getTime() - record.replacedAt.getTime() > REFRESH_REUSE_GRACE_MS) {
      return null;
    }
    try {
      return this.encryption.decrypt(record.replacedByTokenEncrypted);
    } catch {
      return null;
    }
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), replacedByTokenEncrypted: null },
    });
  }

  /**
   * Fait tourner un jeton de rafraîchissement de façon atomique.
   *
   * - Une requête parallèle qui présente le même jeton dans la fenêtre de
   *   grâce reçoit le même remplaçant : elle n'est pas déconnectée.
   * - Une réutilisation plus tardive est traitée comme un vol : toute la
   *   famille est révoquée.
   */
  async rotateRefreshToken(
    token: string,
  ): Promise<{ userId: string; refreshToken: string } | null> {
    const tokenHash = sha256(token);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!record) {
      return null;
    }

    const now = new Date();

    if (record.revokedAt) {
      const replacement = this.benignReplacement(record, now);
      if (replacement) {
        return { userId: record.userId, refreshToken: replacement };
      }
      await this.revokeFamily(record.familyId);
      return null;
    }

    if (record.expiresAt <= now) {
      return null;
    }

    const newToken = randomToken();
    const claim = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null, expiresAt: { gt: now } },
      data: {
        revokedAt: now,
        replacedAt: now,
        replacedByTokenEncrypted: this.encryption.encrypt(newToken),
      },
    });

    if (claim.count === 0) {
      // Une requête parallèle a gagné la course : on lui emprunte son jeton
      // tant qu'il est encore dans la fenêtre de grâce.
      const current = await this.prisma.refreshToken.findUnique({ where: { id: record.id } });
      const replacement = current ? this.benignReplacement(current, new Date()) : null;
      if (replacement) {
        return { userId: record.userId, refreshToken: replacement };
      }
      await this.revokeFamily(record.familyId);
      return null;
    }

    await this.prisma.refreshToken.create({
      data: {
        userId: record.userId,
        tokenHash: sha256(newToken),
        expiresAt: new Date(now.getTime() + this.config.jwtRefreshTtlMs),
        familyId: record.familyId,
      },
    });

    return { userId: record.userId, refreshToken: newToken };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), replacedByTokenEncrypted: null },
    });
  }

  signAccessToken(payload: { sub: string; role: string }) {
    return this.jwt.sign({ ...payload, purpose: 'access' });
  }

  /** Jeton court utilisé uniquement pour terminer une connexion 2FA. */
  signTwoFactorChallenge(userId: string): string {
    return this.jwt.sign({ sub: userId, purpose: '2fa' }, { expiresIn: '5m' });
  }

  verifyTwoFactorChallenge(token: string): { userId: string } | null {
    try {
      const payload = this.jwt.verify<{ sub?: string; purpose?: string }>(token);
      if (payload.purpose !== '2fa' || !payload.sub) {
        return null;
      }
      return { userId: payload.sub };
    } catch {
      return null;
    }
  }
}
