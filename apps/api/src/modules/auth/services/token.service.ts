import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../../config/app-config.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

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

  async issueRefreshToken(userId: string): Promise<string> {
    const token = randomToken();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
    return token;
  }

  async rotateRefreshToken(
    token: string,
  ): Promise<{ userId: string; refreshToken: string } | null> {
    const tokenHash = sha256(token);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      return null;
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const newRefresh = await this.issueRefreshToken(record.userId);
    return { userId: record.userId, refreshToken: newRefresh };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
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
