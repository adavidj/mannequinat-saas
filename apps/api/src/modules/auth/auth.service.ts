import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { AuditService } from '../../audit/audit.service';
import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';

function isAgeAtLeast18(birthDate: string): boolean {
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Date de naissance invalide.');
  }
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  if (age < 18) {
    throw new ForbiddenException('Seuls les majeurs de 18 ans et plus sont autorisés sur la plateforme.');
  }
  return true;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    role: UserRole;
    birthDate?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    if (input.role === 'MODELE') {
      if (!input.birthDate) {
        throw new BadRequestException('La date de naissance est obligatoire pour un compte modèle.');
      }
      isAgeAtLeast18(input.birthDate);
    }

    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cette adresse e-mail.');
    }

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const user = await this.users.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
    });

    const verificationToken = await this.tokens.issueEmailVerification(user.id);
    const refreshToken = await this.tokens.issueRefreshToken(user.id);
    const accessToken = this.tokens.signAccessToken({ sub: user.id, role: user.role });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.register',
      entityType: 'user',
      entityId: user.id,
      metadata: { role: user.role },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      user: { id: user.id, email: user.email, role: user.role, emailVerifiedAt: user.emailVerifiedAt },
      accessToken,
      refreshToken,
      emailVerificationToken: verificationToken,
      message:
        "Inscription réussie. Un e-mail de vérification est requis avant toute action (à envoyer via un service d'e-mail en phase suivante).",
    };
  }

  async login(input: {
    email: string;
    password: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Compte suspendu ou supprimé.');
    }
    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const refreshToken = await this.tokens.issueRefreshToken(user.id);
    const accessToken = this.tokens.signAccessToken({ sub: user.id, role: user.role });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      user: { id: user.id, email: user.email, role: user.role, emailVerifiedAt: user.emailVerifiedAt },
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(input: {
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const result = await this.tokens.verifyEmailToken(input.token);
    if (!result) {
      throw new BadRequestException("Jeton de vérification d'e-mail invalide ou expiré.");
    }
    const user = await this.users.markEmailVerified(result.userId);

    await this.audit.log({
      actorId: user.id,
      action: 'auth.email_verified',
      entityType: 'user',
      entityId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return { message: 'Adresse e-mail vérifiée avec succès.' };
  }

  async refresh(input: {
    refreshToken: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const rotated = await this.tokens.rotateRefreshToken(input.refreshToken);
    if (!rotated) {
      throw new UnauthorizedException('Jeton de rafraîchissement invalide ou révoqué.');
    }
    const user = await this.users.findById(rotated.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Compte non autorisé.');
    }
    const accessToken = this.tokens.signAccessToken({ sub: user.id, role: user.role });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.refresh',
      entityType: 'user',
      entityId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return { accessToken, refreshToken: rotated.refreshToken };
  }

  async logout(userId: string, input?: { ipAddress?: string | null; userAgent?: string | null }) {
    await this.tokens.revokeAllForUser(userId);

    await this.audit.log({
      actorId: userId,
      action: 'auth.logout',
      entityType: 'user',
      entityId: userId,
      ipAddress: input?.ipAddress,
      userAgent: input?.userAgent,
    });

    return { message: 'Déconnexion réussie.' };
  }
}
