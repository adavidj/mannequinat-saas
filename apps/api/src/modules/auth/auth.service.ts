import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/app-config.service';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { calculateAge } from '../../common/utils/age';

function isAgeAtLeast18(birthDate: string): boolean {
  const age = calculateAge(birthDate);
  if (Number.isNaN(age)) {
    throw new BadRequestException('Date de naissance invalide.');
  }
  if (age < 18) {
    throw new ForbiddenException(
      'Seuls les majeurs de 18 ans et plus sont autorisés sur la plateforme.',
    );
  }
  return true;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly config: AppConfigService,
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
        throw new BadRequestException(
          'La date de naissance est obligatoire pour un compte modèle.',
        );
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

    const verificationUrl = `${this.config.appPublicUrl}/verifier-email?token=${encodeURIComponent(verificationToken)}`;
    await this.mail
      .send({
        to: user.email,
        subject: 'Confirmez votre adresse e-mail — ModelBénin',
        text: [
          'Bienvenue sur ModelBénin.',
          'Confirmez votre adresse e-mail pour activer toutes les fonctionnalités de votre compte :',
          verificationUrl,
          'Ce lien expire dans ' + this.config.emailVerificationTtlMinutes + ' minutes.',
        ].join('\n\n'),
        html: `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.6">
  <h1 style="font-size:20px">Bienvenue sur ModelBénin</h1>
  <p>Confirmez votre adresse e-mail pour activer toutes les fonctionnalités de votre compte.</p>
  <p><a href="${verificationUrl}" style="display:inline-block;background:#8a5a2b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none">Confirmer mon adresse</a></p>
  <p style="font-size:12px;color:#64748b">Ce lien expire dans ${this.config.emailVerificationTtlMinutes} minutes.</p>
</div>`,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `E-mail de vérification non envoyé pour ${user.id} : ${
            error instanceof Error ? error.message : 'erreur inconnue'
          }`,
        );
      });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
      },
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
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
      },
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

    await this.notifications.notify({
      userId: user.id,
      type: 'WELCOME',
      title: 'Bienvenue sur ModelBénin',
      body:
        user.role === UserRole.MODELE
          ? 'Votre adresse e-mail est confirmée. Complétez votre profil et ajoutez vos trois photos guidées pour débloquer la visibilité.'
          : 'Votre adresse e-mail est confirmée. Complétez votre organisation pour demander la vérification.',
      link: user.role === UserRole.MODELE ? '/dashboard/profil' : '/dashboard/organisation',
    });

    return { message: 'Adresse e-mail vérifiée avec succès.' };
  }

  async forgotPassword(input: {
    email: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    const genericMessage =
      'Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d’être envoyé.';

    if (!user || user.status !== 'ACTIVE') {
      return { message: genericMessage };
    }

    const resetToken = await this.tokens.issuePasswordReset(user.id);
    const resetUrl = `${this.config.appPublicUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(resetToken)}`;

    await this.mail
      .send({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe — ModelBénin',
        text: [
          'Vous avez demandé à réinitialiser votre mot de passe ModelBénin.',
          'Choisissez un nouveau mot de passe avec le lien ci-dessous :',
          resetUrl,
          `Ce lien expire dans ${this.config.passwordResetTtlMinutes} minutes et ne peut être utilisé qu’une seule fois.`,
          'Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.',
        ].join('\n\n'),
        html: `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.6">
  <h1 style="font-size:20px">Réinitialisation du mot de passe</h1>
  <p>Vous avez demandé à réinitialiser votre mot de passe ModelBénin.</p>
  <p><a href="${resetUrl}" style="display:inline-block;background:#8a5a2b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none">Choisir un nouveau mot de passe</a></p>
  <p style="font-size:12px;color:#64748b">Ce lien expire dans ${this.config.passwordResetTtlMinutes} minutes et ne peut être utilisé qu’une seule fois. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>
</div>`,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `E-mail de réinitialisation non envoyé pour ${user.id} : ${
            error instanceof Error ? error.message : 'erreur inconnue'
          }`,
        );
      });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.password_reset_requested',
      entityType: 'user',
      entityId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return { message: genericMessage };
  }

  async resetPassword(input: {
    token: string;
    password: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const result = await this.tokens.consumePasswordResetToken(input.token);
    if (!result) {
      throw new BadRequestException(
        'Lien de réinitialisation invalide, expiré ou déjà utilisé. Demandez un nouveau lien.',
      );
    }

    const user = await this.users.findById(result.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new BadRequestException('Ce compte ne peut plus être réinitialisé.');
    }

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    await this.users.updatePassword(user.id, passwordHash);
    await this.tokens.revokeAllForUser(user.id);

    await this.audit.log({
      actorId: user.id,
      action: 'auth.password_reset',
      entityType: 'user',
      entityId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    await this.mail
      .send({
        to: user.email,
        subject: 'Votre mot de passe a été modifié — ModelBénin',
        text: [
          'Votre mot de passe ModelBénin vient d’être modifié.',
          'Toutes vos sessions actives ont été déconnectées par sécurité.',
          'Si vous n’êtes pas à l’origine de ce changement, contactez immédiatement notre équipe.',
        ].join('\n\n'),
        html: `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.6">
  <h1 style="font-size:20px">Mot de passe modifié</h1>
  <p>Votre mot de passe ModelBénin vient d’être modifié et toutes vos sessions actives ont été déconnectées.</p>
  <p>Si vous n’êtes pas à l’origine de ce changement, contactez immédiatement notre équipe.</p>
</div>`,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `E-mail de confirmation de réinitialisation non envoyé pour ${user.id} : ${
            error instanceof Error ? error.message : 'erreur inconnue'
          }`,
        );
      });

    return {
      message: 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.',
    };
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
