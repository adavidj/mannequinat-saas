import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Experience } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type OwnerExperience = Omit<Experience, 'profileId' | 'proofKey'>;

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
      throw new BadRequestException('La date de fin doit être postérieure ou égale à la date de début.');
    }

    const updated = await this.prisma.experience.update({
      where: { id: experience.id },
      data: {
        title: input.title,
        org: input.org,
        startDate: input.startDate,
        endDate: input.endDate,
      },
    });
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
    await this.log(userId, 'experience.delete', experience.id, context);
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

  private async log(userId: string, action: string, experienceId: string, context: AuditContext): Promise<void> {
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
