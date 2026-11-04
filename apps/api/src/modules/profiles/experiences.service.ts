import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Experience, ProfileLevel, ProfileVisibility } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateExperienceDto,
  ReviewExperienceDto,
  UpdateExperienceDto,
} from './dto/experience.dto';

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type OwnerExperience = Omit<Experience, 'profileId' | 'proofKey'>;

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
        endDate: input.endDate,
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
    const endDate = input.endDate ?? experience.endDate;
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
    await this.syncProfileLevel(experience.profileId, userId, context);
    await this.log(userId, 'experience.delete', experience.id, context);
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
    };
  }
}
