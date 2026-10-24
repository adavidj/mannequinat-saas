import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ModelProfile, ProfileLevel, ProfileVisibility } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type OwnerProfile = {
  id: string;
  level: ProfileLevel;
  displayName: string;
  birthDate: string;
  city: string;
  heightCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  shoeSize: number | null;
  visibility: ProfileVisibility;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
    private readonly audit: AuditService,
  ) {}

  async createOwnedProfile(userId: string, input: CreateProfileDto, context: AuditContext): Promise<OwnerProfile> {
    const existing = await this.prisma.modelProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Un profil modèle existe déjà pour ce compte.');
    }

    this.assertVisibilityAllowed(ProfileLevel.DEBUTANT, input.visibility ?? ProfileVisibility.PRIVATE);

    const profile = await this.prisma.modelProfile.create({
      data: {
        userId,
        level: ProfileLevel.DEBUTANT,
        displayName: input.displayName,
        birthDateEncrypted: this.encryption.encrypt(input.birthDate),
        city: input.city,
        heightCmEncrypted: this.encryptOptionalNumber(input.heightCm),
        chestCmEncrypted: this.encryptOptionalNumber(input.chestCm),
        waistCmEncrypted: this.encryptOptionalNumber(input.waistCm),
        hipsCmEncrypted: this.encryptOptionalNumber(input.hipsCm),
        shoeSizeEncrypted: this.encryptOptionalNumber(input.shoeSize),
        visibility: input.visibility ?? ProfileVisibility.PRIVATE,
        bio: input.bio,
      },
    });

    await this.audit.log({
      actorId: userId,
      action: 'profile.create',
      entityType: 'model_profile',
      entityId: profile.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.toOwnerProfile(profile);
  }

  async getOwnedProfile(userId: string): Promise<OwnerProfile> {
    const profile = await this.prisma.modelProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profil modèle introuvable.');
    }
    return this.toOwnerProfile(profile);
  }

  async updateOwnedProfile(
    userId: string,
    input: UpdateProfileDto,
    context: AuditContext,
  ): Promise<OwnerProfile> {
    const existing = await this.prisma.modelProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw new NotFoundException('Profil modèle introuvable.');
    }

    if (input.visibility) {
      this.assertVisibilityAllowed(existing.level, input.visibility);
    }

    const profile = await this.prisma.modelProfile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        birthDateEncrypted: input.birthDate ? this.encryption.encrypt(input.birthDate) : undefined,
        city: input.city,
        heightCmEncrypted:
          input.heightCm === undefined ? undefined : this.encryptOptionalNumber(input.heightCm),
        chestCmEncrypted: input.chestCm === undefined ? undefined : this.encryptOptionalNumber(input.chestCm),
        waistCmEncrypted: input.waistCm === undefined ? undefined : this.encryptOptionalNumber(input.waistCm),
        hipsCmEncrypted: input.hipsCm === undefined ? undefined : this.encryptOptionalNumber(input.hipsCm),
        shoeSizeEncrypted:
          input.shoeSize === undefined ? undefined : this.encryptOptionalNumber(input.shoeSize),
        visibility: input.visibility,
        bio: input.bio,
      },
    });

    await this.audit.log({
      actorId: userId,
      action: 'profile.update',
      entityType: 'model_profile',
      entityId: profile.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.toOwnerProfile(profile);
  }

  private assertVisibilityAllowed(level: ProfileLevel, visibility: ProfileVisibility): void {
    if (level === ProfileLevel.DEBUTANT && visibility === ProfileVisibility.PUBLIC) {
      throw new ForbiddenException('Un profil débutant ne peut jamais être public.');
    }
  }

  private encryptOptionalNumber(value: number | undefined): string | undefined {
    return value === undefined ? undefined : this.encryption.encrypt(value.toString());
  }

  private decryptOptionalNumber(value: string | null): number | null {
    if (!value) {
      return null;
    }
    const decrypted = Number(this.encryption.decrypt(value));
    if (!Number.isInteger(decrypted)) {
      throw new Error('Valeur chiffrée de mensuration invalide.');
    }
    return decrypted;
  }

  private toOwnerProfile(profile: ModelProfile): OwnerProfile {
    return {
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
    };
  }
}
