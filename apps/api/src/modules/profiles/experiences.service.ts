import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Experience, ProfileLevel, ProfileVisibility } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStorageService } from '../../storage/object-storage.service';
import {
  CreateExperienceDto,
  ReviewExperienceDto,
  UpdateExperienceDto,
} from './dto/experience.dto';

const MAX_PROOF_BYTES = 10 * 1024 * 1024;

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type UploadedProofFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

type OwnerExperience = Omit<Experience, 'profileId' | 'proofKey'> & {
  hasProof: boolean;
};

type ReviewExperience = OwnerExperience & {
  profile: {
    id: string;
    displayName: string;
    city: string;
    user: { email: string };
  };
};

@Injectable()
export class ExperiencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
    private readonly audit: AuditService,
  ) {}

  async createOwnedExperience(
    userId: string,
    input: CreateExperienceDto,
    context: AuditContext,
  ): Promise<OwnerExperience> {
    const profile = await this.findProfileByUserId(userId);
    const experience = await this.prisma.experience.create({
      data: {
        profileId: profile.id,
        title: input.title,
        org: input.org,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
      },
    });
    await this.log(userId, 'experience.create', experience.id, context);
    return this.toOwnerExperience(experience);
  }

  async listOwnedExperiences(userId: string): Promise<OwnerExperience[]> {
    const profile = await this.findProfileByUserId(userId);
    const experiences = await this.prisma.experience.findMany({
      where: { profileId: profile.id },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });
    return experiences.map((experience) => this.toOwnerExperience(experience));
  }

  async updateOwnedExperience(
    userId: string,
    experienceId: string,
    input: UpdateExperienceDto,
    context: AuditContext,
  ): Promise<OwnerExperience> {
    const experience = await this.findOwnedExperience(userId, experienceId);
    const startDate = input.startDate ?? experience.startDate;
    const endDate = input.endDate === undefined ? experience.endDate : input.endDate;
    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'La date de fin doit être postérieure ou égale à la date de début.',
      );
    }

    const updated = await this.prisma.experience.update({
      where: { id: experience.id },
      data: {
        title: input.title,
        org: input.org,
        startDate: input.startDate,
        endDate: input.endDate,
        // A model can edit a validated entry, but the edited version must be reviewed again.
        verified: false,
      },
    });
    await this.syncProfileLevel(updated.profileId, userId, context);
    await this.log(userId, 'experience.update', updated.id, context);
    return this.toOwnerExperience(updated);
  }

  async deleteOwnedExperience(
    userId: string,
    experienceId: string,
    context: AuditContext,
  ): Promise<void> {
    const experience = await this.findOwnedExperience(userId, experienceId);
    await this.prisma.experience.delete({ where: { id: experience.id } });
    if (experience.proofKey) {
      await this.storage.deleteObject(experience.proofKey).catch(() => undefined);
    }
    await this.syncProfileLevel(experience.profileId, userId, context);
    await this.log(userId, 'experience.delete', experience.id, context);
  }

  async uploadOwnedProof(
    userId: string,
    experienceId: string,
    file: UploadedProofFile | undefined,
    context: AuditContext,
  ): Promise<OwnerExperience> {
    const experience = await this.findOwnedExperience(userId, experienceId);
    if (!file) {
      throw new BadRequestException('Le justificatif est obligatoire.');
    }
    if (file.size > MAX_PROOF_BYTES) {
      throw new BadRequestException('Le justificatif dépasse la taille maximale de 10 Mo.');
    }

    const detected = this.detectProofType(file.buffer);
    if (!detected || detected.mimeType !== file.mimetype) {
      throw new BadRequestException(
        'Le justificatif doit être un PDF, un JPEG, un PNG ou un WebP valide.',
      );
    }

    const storageKey = `profiles/${experience.profileId}/experiences/${experience.id}/${randomUUID()}${detected.extension}`;
    await this.storage.putPrivateFile(storageKey, file.buffer, detected.mimeType);

    try {
      const updated = await this.prisma.experience.update({
        where: { id: experience.id },
        // Un nouveau justificatif doit être contrôlé à nouveau.
        data: { proofKey: storageKey, verified: false },
      });
      if (experience.proofKey) {
        await this.storage.deleteObject(experience.proofKey).catch(() => undefined);
      }
      await this.syncProfileLevel(updated.profileId, userId, context);
      await this.log(userId, 'experience.proof.upload', updated.id, context);
      return this.toOwnerExperience(updated);
    } catch (error: unknown) {
      await this.storage.deleteObject(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async deleteOwnedProof(
    userId: string,
    experienceId: string,
    context: AuditContext,
  ): Promise<OwnerExperience> {
    const experience = await this.findOwnedExperience(userId, experienceId);
    if (!experience.proofKey) {
      throw new NotFoundException('Aucun justificatif à supprimer.');
    }

    const updated = await this.prisma.experience.update({
      where: { id: experience.id },
      data: { proofKey: null, verified: false },
    });
    await this.storage.deleteObject(experience.proofKey).catch(() => undefined);
    await this.syncProfileLevel(updated.profileId, userId, context);
    await this.log(userId, 'experience.proof.delete', updated.id, context);
    return this.toOwnerExperience(updated);
  }

  async getOwnedProofUrl(
    userId: string,
    experienceId: string,
  ): Promise<{ url: string; expiresAt: Date; contentType: string }> {
    const experience = await this.findOwnedExperience(userId, experienceId);
    if (!experience.proofKey) {
      throw new NotFoundException('Aucun justificatif téléversé.');
    }
    const contentType = this.contentTypeForProofKey(experience.proofKey);
    const signed = await this.storage.createDownloadUrl(experience.proofKey, contentType);
    return { ...signed, contentType };
  }

  async getReviewProofUrl(
    adminId: string,
    experienceId: string,
    context: AuditContext,
  ): Promise<{ url: string; expiresAt: Date; contentType: string }> {
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
      select: { id: true, profileId: true, proofKey: true },
    });
    if (!experience) {
      throw new NotFoundException('Expérience introuvable.');
    }
    if (!experience.proofKey) {
      throw new NotFoundException('Aucun justificatif téléversé pour cette expérience.');
    }

    const contentType = this.contentTypeForProofKey(experience.proofKey);
    const signed = await this.storage.createDownloadUrl(experience.proofKey, contentType);
    await this.audit.log({
      actorId: adminId,
      action: 'experience.proof.viewed',
      entityType: 'experience',
      entityId: experience.id,
      metadata: { profileId: experience.profileId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return { ...signed, contentType };
  }

  async listForReview(filters: {
    verified?: boolean;
    take: number;
    skip: number;
  }): Promise<{ items: ReviewExperience[]; total: number; take: number; skip: number }> {
    const where = filters.verified === undefined ? {} : { verified: filters.verified };
    const [experiences, total] = await this.prisma.$transaction([
      this.prisma.experience.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: filters.take,
        skip: filters.skip,
        include: {
          profile: {
            select: {
              id: true,
              displayName: true,
              city: true,
              user: { select: { email: true } },
            },
          },
        },
      }),
      this.prisma.experience.count({ where }),
    ]);

    return {
      items: experiences.map((experience) => ({
        ...this.toOwnerExperience(experience),
        profile: experience.profile,
      })),
      total,
      take: filters.take,
      skip: filters.skip,
    };
  }

  async reviewExperience(
    adminId: string,
    experienceId: string,
    input: ReviewExperienceDto,
    context: AuditContext,
  ): Promise<OwnerExperience> {
    const existing = await this.prisma.experience.findUnique({ where: { id: experienceId } });
    if (!existing) {
      throw new NotFoundException('Expérience introuvable.');
    }

    const experience = await this.prisma.experience.update({
      where: { id: experienceId },
      data: { verified: input.verified },
    });
    await this.syncProfileLevel(experience.profileId, adminId, context);
    await this.log(
      adminId,
      `experience.verification.${input.verified ? 'approved' : 'rejected'}`,
      experience.id,
      context,
    );
    return this.toOwnerExperience(experience);
  }

  private async findProfileByUserId(userId: string): Promise<{ id: string }> {
    const profile = await this.prisma.modelProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Profil modèle introuvable.');
    }
    return profile;
  }

  private async findOwnedExperience(userId: string, experienceId: string): Promise<Experience> {
    const experience = await this.prisma.experience.findFirst({
      where: {
        id: experienceId,
        profile: { userId },
      },
    });
    if (!experience) {
      throw new NotFoundException('Expérience introuvable.');
    }
    return experience;
  }

  private async syncProfileLevel(
    profileId: string,
    actorId: string,
    context: AuditContext,
  ): Promise<void> {
    const [profile, verifiedExperienceCount] = await Promise.all([
      this.prisma.modelProfile.findUnique({
        where: { id: profileId },
        select: { id: true, level: true, visibility: true },
      }),
      this.prisma.experience.count({ where: { profileId, verified: true } }),
    ]);
    if (!profile) {
      throw new NotFoundException('Profil modèle introuvable.');
    }

    const nextLevel = verifiedExperienceCount > 0 ? ProfileLevel.CONFIRME : ProfileLevel.DEBUTANT;
    if (profile.level === nextLevel) {
      return;
    }

    const demoted = nextLevel === ProfileLevel.DEBUTANT;
    await this.prisma.modelProfile.update({
      where: { id: profile.id },
      data: {
        level: nextLevel,
        // A demoted profile must not stay publicly visible while it awaits a new verification.
        visibility: demoted ? ProfileVisibility.PRIVATE : undefined,
      },
    });
    await this.audit.log({
      actorId,
      action: demoted ? 'profile.level.demoted' : 'profile.level.confirmed',
      entityType: 'model_profile',
      entityId: profile.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private async log(
    userId: string,
    action: string,
    experienceId: string,
    context: AuditContext,
  ): Promise<void> {
    await this.audit.log({
      actorId: userId,
      action,
      entityType: 'experience',
      entityId: experienceId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private toOwnerExperience(experience: Experience): OwnerExperience {
    return {
      id: experience.id,
      title: experience.title,
      org: experience.org,
      startDate: experience.startDate,
      endDate: experience.endDate,
      verified: experience.verified,
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
      hasProof: Boolean(experience.proofKey),
    };
  }

  private detectProofType(
    buffer: Buffer,
  ): { mimeType: string; extension: '.pdf' | '.jpg' | '.png' | '.webp' } | null {
    if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
      return { mimeType: 'application/pdf', extension: '.pdf' };
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mimeType: 'image/jpeg', extension: '.jpg' };
    }
    if (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return { mimeType: 'image/png', extension: '.png' };
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { mimeType: 'image/webp', extension: '.webp' };
    }
    return null;
  }

  private contentTypeForProofKey(key: string): string {
    if (key.endsWith('.pdf')) {
      return 'application/pdf';
    }
    if (key.endsWith('.jpg')) {
      return 'image/jpeg';
    }
    if (key.endsWith('.png')) {
      return 'image/png';
    }
    return 'image/webp';
  }
}
