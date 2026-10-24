import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModerationStatus, PhotoKind, ProfileVisibility } from '@prisma/client';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

import { PhotosService, UploadedImageFile } from '../src/modules/photos/photos.service';

function buildPhoto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'photo-1',
    profileId: 'profile-1',
    storageKey: 'profiles/profile-1/photos/photo-1.webp',
    mimeType: 'image/webp',
    sizeBytes: 100,
    width: 1,
    height: 1,
    kind: PhotoKind.PORTRAIT,
    moderationStatus: ModerationStatus.PENDING,
    visibilityConsent: ProfileVisibility.VERIFIED_AGENCIES,
    visibilityConsentAt: new Date('2026-10-24T00:00:00.000Z'),
    createdAt: new Date('2026-10-24T00:00:00.000Z'),
    updatedAt: new Date('2026-10-24T00:00:00.000Z'),
    ...overrides,
  };
}

function createService() {
  const prisma = {
    modelProfile: {
      findUnique: vi.fn().mockResolvedValue({ id: 'profile-1', visibility: ProfileVisibility.VERIFIED_AGENCIES }),
    },
    photo: {
      create: vi.fn().mockResolvedValue(buildPhoto()),
      findMany: vi.fn().mockResolvedValue([buildPhoto()]),
      findFirst: vi.fn().mockResolvedValue(buildPhoto()),
      delete: vi.fn().mockResolvedValue(buildPhoto()),
    },
  };
  const storage = {
    putPrivateImage: vi.fn().mockResolvedValue(undefined),
    deleteObject: vi.fn().mockResolvedValue(undefined),
    createDownloadUrl: vi.fn().mockResolvedValue({
      url: 'https://storage.example.test/signed',
      expiresAt: new Date('2026-10-24T00:05:00.000Z'),
    }),
  };
  const config = { photoMaxBytes: 5 * 1024 * 1024 };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };

  return {
    service: new PhotosService(prisma as never, storage as never, config as never, audit as never),
    prisma,
    storage,
    audit,
  };
}

describe('PhotosService', () => {
  it('sanitizes a real PNG and stores only a private WebP rendition', async () => {
    const { service, prisma, storage, audit } = createService();
    const png = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const result = await service.uploadOwnedPhoto(
      'user-1',
      { buffer: png, size: png.length, mimetype: 'image/png' },
      { kind: PhotoKind.PORTRAIT, visibilityConsent: true },
      {},
    );

    expect(storage.putPrivateImage).toHaveBeenCalledWith(
      expect.stringMatching(/^profiles\/profile-1\/photos\/.+\.webp$/),
      expect.any(Buffer),
    );
    expect(prisma.photo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mimeType: 'image/webp',
          moderationStatus: ModerationStatus.PENDING,
          visibilityConsent: ProfileVisibility.VERIFIED_AGENCIES,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'photo.upload' }));
    expect(result.mimeType).toBe('image/webp');
  });

  it('rejects a file whose content is not an authorized image', async () => {
    const { service, storage } = createService();

    await expect(
      service.uploadOwnedPhoto(
        'user-1',
        { buffer: Buffer.from('not an image'), size: 12, mimetype: 'image/png' } satisfies UploadedImageFile,
        { kind: PhotoKind.PORTRAIT, visibilityConsent: true },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.putPrivateImage).not.toHaveBeenCalled();
  });

  it('does not issue a signed URL for a photo outside the owner profile', async () => {
    const { service, prisma, storage } = createService();
    prisma.photo.findFirst.mockResolvedValue(null);

    await expect(service.getOwnedPhotoUrl('user-1', 'other-photo')).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.createDownloadUrl).not.toHaveBeenCalled();
  });
});
