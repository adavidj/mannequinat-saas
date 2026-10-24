import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ModerationStatus, Photo, PhotoKind, ProfileVisibility } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { UploadPhotoDto } from './dto/photo.dto';

const MAX_INPUT_PIXELS = 25_000_000;
const MAX_OUTPUT_DIMENSION = 1_600;

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

type OwnedPhoto = {
  id: string;
  kind: PhotoKind;
  moderationStatus: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  visibilityConsent: ProfileVisibility;
  visibilityConsentAt: Date | null;
  createdAt: Date;
};

type OwnedPhotoWithUrl = OwnedPhoto & {
  signedUrl: string;
  signedUrlExpiresAt: Date;
};

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  async uploadOwnedPhoto(
    userId: string,
    file: UploadedImageFile | undefined,
    input: UploadPhotoDto,
    context: AuditContext,
  ): Promise<OwnedPhoto> {
    const profile = await this.prisma.modelProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Créez votre profil avant de téléverser une photo.');
    }
    if (!file) {
      throw new BadRequestException('Le fichier photo est obligatoire.');
    }
    if (file.size > this.config.photoMaxBytes) {
      throw new BadRequestException('La photo dépasse la taille maximale autorisée.');
    }

    const sourceMimeType = this.detectImageMimeType(file.buffer);
    if (!sourceMimeType || sourceMimeType !== file.mimetype) {
      throw new BadRequestException('Le type réel du fichier ne correspond pas à une image autorisée.');
    }

    const processed = await this.sanitizeImage(file.buffer);
    const storageKey = `profiles/${profile.id}/photos/${randomUUID()}.webp`;
    await this.storage.putPrivateImage(storageKey, processed.buffer);

    try {
      const consentedAt = new Date();
      const photo = await this.prisma.photo.create({
        data: {
          profileId: profile.id,
          storageKey,
          mimeType: 'image/webp',
          sizeBytes: processed.sizeBytes,
          width: processed.width,
          height: processed.height,
          kind: input.kind,
          moderationStatus: ModerationStatus.PENDING,
          visibilityConsent: profile.visibility,
          visibilityConsentAt: consentedAt,
        },
      });

      await this.audit.log({
        actorId: userId,
        action: 'photo.upload',
        entityType: 'photo',
        entityId: photo.id,
        metadata: {
          kind: input.kind,
          visibility: profile.visibility,
          visibilityConsent: input.visibilityConsent,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return this.toOwnedPhoto(photo);
    } catch (error: unknown) {
      await this.storage.deleteObject(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async listOwnedPhotos(userId: string): Promise<OwnedPhotoWithUrl[]> {
    const profile = await this.prisma.modelProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profil modèle introuvable.');
    }
    const photos = await this.prisma.photo.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      photos.map(async (photo) => {
        const signed = await this.storage.createDownloadUrl(photo.storageKey);
        return {
          ...this.toOwnedPhoto(photo),
          signedUrl: signed.url,
          signedUrlExpiresAt: signed.expiresAt,
        };
      }),
    );
  }

  async getOwnedPhotoUrl(userId: string, photoId: string): Promise<{ url: string; expiresAt: Date }> {
    const photo = await this.findOwnedPhoto(userId, photoId);
    return this.storage.createDownloadUrl(photo.storageKey);
  }

  async deleteOwnedPhoto(userId: string, photoId: string, context: AuditContext): Promise<void> {
    const photo = await this.findOwnedPhoto(userId, photoId);
    await this.storage.deleteObject(photo.storageKey);
    await this.prisma.photo.delete({ where: { id: photo.id } });
    await this.audit.log({
      actorId: userId,
      action: 'photo.delete',
      entityType: 'photo',
      entityId: photo.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private async findOwnedPhoto(userId: string, photoId: string): Promise<Photo> {
    const photo = await this.prisma.photo.findFirst({
      where: {
        id: photoId,
        profile: { userId },
      },
    });
    if (!photo) {
      throw new NotFoundException('Photo introuvable.');
    }
    return photo;
  }

  private detectImageMimeType(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return 'image/png';
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }
    return null;
  }

  private async sanitizeImage(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; sizeBytes: number; width: number | null; height: number | null }> {
    try {
      const output = await sharp(buffer, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .resize({
          width: MAX_OUTPUT_DIMENSION,
          height: MAX_OUTPUT_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: output.data,
        sizeBytes: output.info.size,
        width: output.info.width ?? null,
        height: output.info.height ?? null,
      };
    } catch {
      throw new BadRequestException('Le fichier image est invalide ou ne peut pas être traité.');
    }
  }

  private toOwnedPhoto(photo: Photo): OwnedPhoto {
    return {
      id: photo.id,
      kind: photo.kind,
      moderationStatus: photo.moderationStatus,
      mimeType: photo.mimeType,
      sizeBytes: photo.sizeBytes,
      width: photo.width,
      height: photo.height,
      visibilityConsent: photo.visibilityConsent,
      visibilityConsentAt: photo.visibilityConsentAt,
      createdAt: photo.createdAt,
    };
  }
}
