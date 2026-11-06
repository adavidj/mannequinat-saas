import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Organization, OrganizationType, UserRole, VerificationStatus } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrganizationDto, ReviewOrganizationDto } from './dto/organization.dto';

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type OwnedOrganization = {
  id: string;
  type: OrganizationType;
  name: string;
  ifu: string | null;
  rccm: string | null;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
};

type AdminOrganization = OwnedOrganization & {
  owner: { id: string; email: string };
};

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async createOwnedOrganization(
    userId: string,
    role: UserRole,
    input: CreateOrganizationDto,
    context: AuditContext,
  ): Promise<OwnedOrganization> {
    this.assertRoleMayCreateType(role, input.type);
    const organization = await this.prisma.organization.create({
      data: {
        ownerId: userId,
        type: input.type,
        name: input.name,
        ifuEncrypted: input.ifu ? this.encryption.encrypt(input.ifu) : null,
        rccmEncrypted: input.rccm ? this.encryption.encrypt(input.rccm) : null,
        verificationStatus: VerificationStatus.PENDING,
      },
    });
    await this.audit.log({
      actorId: userId,
      action: 'organization.create',
      entityType: 'organization',
      entityId: organization.id,
      metadata: { type: organization.type },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return this.toOwnedOrganization(organization);
  }

  async listOwnedOrganizations(userId: string): Promise<OwnedOrganization[]> {
    const organizations = await this.prisma.organization.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return organizations.map((organization) => this.toOwnedOrganization(organization));
  }

  /**
   * File de vérification : l'admin doit voir les justificatifs (IFU/RCCM)
   * déchiffrés pour pouvoir statuer. Chaque décision est journalisée.
   */
  async listForReview(
    adminId: string,
    filters: {
      verificationStatus?: VerificationStatus;
      take: number;
      skip: number;
    },
    context: AuditContext,
  ): Promise<{ items: AdminOrganization[]; total: number; take: number; skip: number }> {
    const where = filters.verificationStatus
      ? { verificationStatus: filters.verificationStatus }
      : {};
    const [organizations, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: filters.take,
        skip: filters.skip,
        include: { owner: { select: { id: true, email: true } } },
      }),
      this.prisma.organization.count({ where }),
    ]);

    const items = organizations.map((organization) => ({
      ...this.toOwnedOrganization(organization),
      owner: organization.owner,
    }));

    // La file expose des justificatifs légaux déchiffrés : l'accès est tracé.
    await this.audit.log({
      actorId: adminId,
      action: 'organization.review.queue.viewed',
      entityType: 'organization',
      entityId: 'queue',
      metadata: {
        count: items.length,
        verificationStatus: filters.verificationStatus ?? null,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { items, total, take: filters.take, skip: filters.skip };
  }

  async requireVerifiedRecruiterOrganization(
    userId: string,
    organizationId?: string,
  ): Promise<{ id: string }> {
    const organization = await this.prisma.organization.findFirst({
      where: {
        ownerId: userId,
        id: organizationId,
        verificationStatus: VerificationStatus.VERIFIED,
        OR: [{ type: OrganizationType.AGENCY }, { type: OrganizationType.RECRUITER }],
      },
      select: { id: true },
    });
    if (!organization) {
      throw new ForbiddenException('Une organisation agence ou recruteur vérifiée est requise.');
    }
    return organization;
  }

  async reviewOrganization(
    adminId: string,
    organizationId: string,
    input: ReviewOrganizationDto,
    context: AuditContext,
  ): Promise<{ id: string; verificationStatus: VerificationStatus }> {
    const existing = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!existing) {
      throw new NotFoundException('Organisation introuvable.');
    }
    if (!existing.ifuEncrypted && !existing.rccmEncrypted) {
      throw new ForbiddenException('Une organisation sans IFU ou RCCM ne peut pas être validée.');
    }

    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { verificationStatus: input.verificationStatus },
    });
    await this.audit.log({
      actorId: adminId,
      action: `organization.verification.${input.verificationStatus.toLowerCase()}`,
      entityType: 'organization',
      entityId: organization.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    const verified = input.verificationStatus === VerificationStatus.VERIFIED;
    await this.notifications.notify({
      userId: organization.ownerId,
      type: verified ? 'ORGANIZATION_APPROVED' : 'ORGANIZATION_REJECTED',
      title: verified ? 'Organisation vérifiée' : 'Organisation refusée',
      body: verified
        ? `Votre organisation « ${organization.name} » est vérifiée. Vous pouvez désormais accéder à la découverte et à la messagerie.`
        : `La vérification de votre organisation « ${organization.name} » a été refusée. Vérifiez les justificatifs IFU/RCCM puis soumettez-les à nouveau.`,
      link: '/dashboard/organisation',
    });
    return { id: organization.id, verificationStatus: organization.verificationStatus };
  }

  private assertRoleMayCreateType(role: UserRole, type: OrganizationType): void {
    const allowed =
      (role === UserRole.AGENCE &&
        (type === OrganizationType.AGENCY || type === OrganizationType.RECRUITER)) ||
      (role === UserRole.FORMATEUR && type === OrganizationType.TRAINING_ORGANIZATION);
    if (!allowed) {
      throw new ForbiddenException("Ce type d'organisation ne correspond pas au rôle du compte.");
    }
  }

  private toOwnedOrganization(organization: Organization): OwnedOrganization {
    return {
      id: organization.id,
      type: organization.type,
      name: organization.name,
      ifu: organization.ifuEncrypted ? this.encryption.decrypt(organization.ifuEncrypted) : null,
      rccm: organization.rccmEncrypted ? this.encryption.decrypt(organization.rccmEncrypted) : null,
      verificationStatus: organization.verificationStatus,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
