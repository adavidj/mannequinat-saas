import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, ReportTargetType, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';

import { AuditService } from '../../audit/audit.service';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { DeleteAccountDto } from './dto/delete-account.dto';

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Export RGPD et suppression définitive du compte.
 *
 * Les données de facturation (paiements) et les journaux d'audit sont conservés
 * conformément aux durées légales. Le compte lui-même est anonymisé : l'ancien
 * identifiant subsiste uniquement pour rattacher ces enregistrements.
 */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
    private readonly storage: ObjectStorageService,
    private readonly audit: AuditService,
  ) {}

  async exportAccount(userId: string, context: AuditContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }

    const profile = await this.prisma.modelProfile.findUnique({ where: { userId } });
    const organizations = await this.prisma.organization.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
    });
    const organizationIds = organizations.map((organization) => organization.id);

    const conversationWhere: Prisma.ConversationWhereInput = {
      OR: [
        ...(profile ? [{ profileId: profile.id }] : []),
        ...(organizationIds.length ? [{ organizationId: { in: organizationIds } }] : []),
      ],
    };

    const [photos, experiences, conversations, subscriptions, payments, reports] =
      await Promise.all([
        profile
          ? this.prisma.photo.findMany({
              where: { profileId: profile.id },
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
        profile
          ? this.prisma.experience.findMany({
              where: { profileId: profile.id },
              orderBy: { startDate: 'asc' },
            })
          : Promise.resolve([]),
        this.prisma.conversation.findMany({
          where: conversationWhere,
          orderBy: { createdAt: 'asc' },
          include: {
            organization: { select: { name: true, type: true } },
            profile: { select: { displayName: true } },
            messages: {
              orderBy: { sentAt: 'asc' },
              select: { id: true, senderId: true, body: true, sentAt: true },
            },
          },
        }),
        this.prisma.subscription.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.payment.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.report.findMany({
          where: { reporterId: userId },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    await this.audit.log({
      actorId: userId,
      action: 'account.export',
      entityType: 'user',
      entityId: userId,
      metadata: {
        photos: photos.length,
        experiences: experiences.length,
        conversations: conversations.length,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      exportedAt: new Date().toISOString(),
      account: user,
      profile: profile
        ? {
            id: profile.id,
            level: profile.level,
            displayName: profile.displayName,
            birthDate: this.encryption.decrypt(profile.birthDateEncrypted),
            city: profile.city,
            heightCm: this.decryptOptionalNumber(profile.heightCmEncrypted),
            chestCm: this.decryptOptionalNumber(profile.chestCmEncrypted),
            waistCm: this.decryptOptionalNumber(profile.waistCmEncrypted),
            hipsCm: this.decryptOptionalNumber(profile.hipsCmEncrypted),
            shoeSize: this.decryptOptionalNumber(profile.shoeSizeEncrypted),
            visibility: profile.visibility,
            bio: profile.bio,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      photos: photos.map((photo) => ({
        id: photo.id,
        kind: photo.kind,
        moderationStatus: photo.moderationStatus,
        visibilityConsent: photo.visibilityConsent,
        visibilityConsentAt: photo.visibilityConsentAt,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        width: photo.width,
        height: photo.height,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
      })),
      experiences: experiences.map((experience) => ({
        id: experience.id,
        title: experience.title,
        org: experience.org,
        startDate: experience.startDate,
        endDate: experience.endDate,
        verified: experience.verified,
        hasProof: Boolean(experience.proofKey),
        createdAt: experience.createdAt,
        updatedAt: experience.updatedAt,
      })),
      organizations: organizations.map((organization) => ({
        id: organization.id,
        type: organization.type,
        name: organization.name,
        ifu: organization.ifuEncrypted ? this.encryption.decrypt(organization.ifuEncrypted) : null,
        rccm: organization.rccmEncrypted
          ? this.encryption.decrypt(organization.rccmEncrypted)
          : null,
        verificationStatus: organization.verificationStatus,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      })),
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        organization: conversation.organization,
        model: conversation.profile,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          fromMe: message.senderId === userId,
          body: message.body,
          sentAt: message.sentAt,
        })),
      })),
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startsAt: subscription.startsAt,
        renewAt: subscription.renewAt,
        endsAt: subscription.endsAt,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        amountFcfa: payment.amountFcfa,
        provider: payment.provider,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
      reports: reports.map((report) => ({
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),
    };
  }

  async deleteAccount(userId: string, input: DeleteAccountDto, context: AuditContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, role: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }
    if (user.status === UserStatus.DELETED) {
      throw new ForbiddenException('Ce compte est déjà supprimé.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password).catch(() => false);
    if (!passwordValid) {
      throw new UnauthorizedException('Mot de passe incorrect.');
    }

    if (user.role === UserRole.ADMIN) {
      const otherAdmins = await this.prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          id: { not: userId },
        },
      });
      if (otherAdmins === 0) {
        throw new ForbiddenException('Le dernier administrateur ne peut pas supprimer son compte.');
      }
    }

    const profile = await this.prisma.modelProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    const organizations = await this.prisma.organization.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const organizationIds = organizations.map((organization) => organization.id);

    const [photos, experiences, conversations] = await Promise.all([
      profile
        ? this.prisma.photo.findMany({
            where: { profileId: profile.id },
            select: { storageKey: true },
          })
        : Promise.resolve([]),
      profile
        ? this.prisma.experience.findMany({
            where: { profileId: profile.id },
            select: { proofKey: true },
          })
        : Promise.resolve([]),
      this.prisma.conversation.findMany({
        where: {
          OR: [
            ...(profile ? [{ profileId: profile.id }] : []),
            ...(organizationIds.length ? [{ organizationId: { in: organizationIds } }] : []),
          ],
        },
        select: { id: true },
      }),
    ]);

    const conversationIds = conversations.map((conversation) => conversation.id);
    const reportWhere: Prisma.ReportWhereInput = {
      OR: [
        { reporterId: userId },
        { targetType: ReportTargetType.USER, targetId: userId },
        ...(profile ? [{ targetType: ReportTargetType.PROFILE, targetId: profile.id }] : []),
        ...(organizationIds.length
          ? [{ targetType: ReportTargetType.ORGANIZATION, targetId: { in: organizationIds } }]
          : []),
      ],
    };
    const blockWhere: Prisma.ProfileOrganizationBlockWhereInput = {
      OR: [
        ...(profile ? [{ profileId: profile.id }] : []),
        ...(organizationIds.length ? [{ organizationId: { in: organizationIds } }] : []),
      ],
    };

    const anonymousEmail = `deleted-${user.id}@modelbenin.invalid`;
    const unusablePasswordHash = await argon2.hash(randomUUID(), {
      type: argon2.argon2id,
    });

    const deleted = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.emailVerificationToken.deleteMany({ where: { userId } });

      await tx.message.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            ...(conversationIds.length ? [{ conversationId: { in: conversationIds } }] : []),
          ],
        },
      });
      if (conversationIds.length) {
        await tx.conversation.deleteMany({ where: { id: { in: conversationIds } } });
      }
      if (profile || organizationIds.length) {
        await tx.profileOrganizationBlock.deleteMany({ where: blockWhere });
      }

      await tx.report.deleteMany({ where: reportWhere });
      await tx.subscription.deleteMany({ where: { userId } });

      if (profile) {
        await tx.modelProfile.delete({ where: { id: profile.id } });
      }
      if (organizationIds.length) {
        await tx.organization.deleteMany({ where: { id: { in: organizationIds } } });
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymousEmail,
          passwordHash: unusablePasswordHash,
          status: UserStatus.DELETED,
          emailVerifiedAt: null,
        },
      });

      return {
        profileDeleted: Boolean(profile),
        organizationsDeleted: organizationIds.length,
        conversationsDeleted: conversationIds.length,
        photosDeleted: photos.length,
        experiencesDeleted: experiences.length,
      };
    });

    // Les objets du stockage sont supprimés après la transaction : si MinIO est
    // momentanément indisponible, les données de profil restent tout de même
    // effacées et la suppression des fichiers peut être rejouée.
    await Promise.allSettled([
      ...photos.map((photo) => this.storage.deleteObject(photo.storageKey)),
      ...experiences
        .filter((experience) => experience.proofKey)
        .map((experience) => this.storage.deleteObject(experience.proofKey as string)),
    ]);

    await this.audit.log({
      actorId: userId,
      action: 'account.delete',
      entityType: 'user',
      entityId: userId,
      metadata: deleted,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      message:
        'Votre compte a été supprimé. Les données de facturation sont conservées pour la durée légale.',
    };
  }

  private decryptOptionalNumber(value: string | null): number | null {
    if (!value) {
      return null;
    }
    return Number(this.encryption.decrypt(value));
  }
}
