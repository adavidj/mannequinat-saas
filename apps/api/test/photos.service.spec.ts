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
    profile: { userId: 'user-1' },
    ...overrides,
  };
}

function createService() {
  const prisma = {
    modelProfile: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: 'profile-1', visibility: ProfileVisibility.VERIFIED_AGENCIES }),
      update: vi.fn().mockResolvedValue(undefined),
    },
    photo: {
      create: vi.fn().mockResolvedValue(buildPhoto()),
      findMany: vi.fn().mockResolvedValue([buildPhoto()]),
      findFirst: vi.fn().mockResolvedValue(buildPhoto()),
      findUnique: vi.fn().mockResolvedValue(buildPhoto()),
      delete: vi.fn().mockResolvedValue(buildPhoto()),
      update: vi
        .fn()
        .mockResolvedValue(buildPhoto({ moderationStatus: ModerationStatus.REJECTED })),
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
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
  const notifications = { notify: vi.fn().mockResolvedValue(undefined) };

  return {
    service: new PhotosService(
      prisma as never,
      storage as never,
      config as never,
      audit as never,
      notifications as never,
    ),
    prisma,
    storage,
    audit,
    notifications,
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
        {
          buffer: Buffer.from('not an image'),
          size: 12,
          mimetype: 'image/png',
        } satisfies UploadedImageFile,
        { kind: PhotoKind.PORTRAIT, visibilityConsent: true },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.putPrivateImage).not.toHaveBeenCalled();
  });

  it('does not issue a signed URL for a photo outside the owner profile', async () => {
    const { service, prisma, storage } = createService();
    prisma.photo.findFirst.mockResolvedValue(null);

    await expect(service.getOwnedPhotoUrl('user-1', 'other-photo')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.createDownloadUrl).not.toHaveBeenCalled();
  });

  it('gives admins a moderation queue with a signed preview URL', async () => {
    const { service, prisma, storage } = createService();
    prisma.photo.findMany.mockResolvedValue([
      buildPhoto({ profile: { id: 'profile-1', displayName: 'Awa', city: 'Cotonou' } }),
    ]);

    const result = await service.listForModeration({
      status: ModerationStatus.PENDING,
      take: 50,
      skip: 0,
    });

    expect(prisma.photo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { moderationStatus: ModerationStatus.PENDING },
        include: { profile: { select: { id: true, displayName: true, city: true } } },
      }),
    );
    expect(storage.createDownloadUrl).toHaveBeenCalledWith(
      'profiles/profile-1/photos/photo-1.webp',
    );
    expect(result.items[0]?.profile.displayName).toBe('Awa');
    expect(result.items[0]?.signedUrl).toBe('https://storage.example.test/signed');
    expect(result.total).toBe(1);
  });

  it('lets an admin open a photo preview and traces the access', async () => {
    const { service, storage, audit } = createService();

    const result = await service.getModerationPhotoUrl('admin-1', 'photo-1', {});

    expect(storage.createDownloadUrl).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'photo.moderation.viewed', entityId: 'photo-1' }),
    );
    expect(result.url).toBe('https://storage.example.test/signed');
  });

  it('allows an admin to reject a photo and records the moderation action', async () => {
    const { service, prisma, audit } = createService();

    const result = await service.moderatePhoto(
      'admin-1',
      'photo-1',
      { moderationStatus: ModerationStatus.REJECTED },
      {},
    );

    expect(prisma.photo.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: { moderationStatus: ModerationStatus.REJECTED },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', action: 'photo.moderation.rejected' }),
    );
    expect(prisma.modelProfile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: { visibility: ProfileVisibility.PRIVATE },
    });
    expect(result.moderationStatus).toBe(ModerationStatus.REJECTED);
  });
});
