import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PhotoKind, ProfileLevel, ProfileVisibility } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ProfilesService } from '../src/modules/profiles/profiles.service';

const encrypted = (value: string): string => `v1:encrypted:${value}`;
const decrypted = (value: string): string => value.replace('v1:encrypted:', '');

function buildProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    userId: 'user-1',
    level: ProfileLevel.DEBUTANT,
    displayName: 'Awa',
    birthDateEncrypted: encrypted('2000-01-01'),
    city: 'Cotonou',
    heightCmEncrypted: encrypted('175'),
    chestCmEncrypted: null,
    waistCmEncrypted: null,
    hipsCmEncrypted: null,
    shoeSizeEncrypted: null,
    visibility: ProfileVisibility.PRIVATE,
    bio: null,
    createdAt: new Date('2026-10-24T00:00:00.000Z'),
    updatedAt: new Date('2026-10-24T00:00:00.000Z'),
    ...overrides,
  };
}

function createService(
  profile: ReturnType<typeof buildProfile> | null,
  approvedPhotoKinds: PhotoKind[] = [],
) {
  const prisma = {
    modelProfile: {
      findUnique: vi.fn().mockResolvedValue(profile),
      create: vi.fn().mockResolvedValue(buildProfile()),
      update: vi.fn().mockResolvedValue(buildProfile()),
    },
    photo: {
      findMany: vi.fn().mockResolvedValue(approvedPhotoKinds.map((kind) => ({ kind }))),
      updateMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
  };
  const encryption = {
    encrypt: vi.fn(encrypted),
    decrypt: vi.fn(decrypted),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };

  return {
    service: new ProfilesService(prisma as never, encryption as never, audit as never),
    prisma,
    encryption,
    audit,
  };
}

describe('ProfilesService', () => {
  it('creates a beginner profile with encrypted sensitive fields', async () => {
    const { service, prisma, encryption, audit } = createService(null);

    const result = await service.createOwnedProfile(
      'user-1',
      {
        displayName: 'Awa',
        birthDate: '2000-01-01',
        city: 'Cotonou',
        heightCm: 175,
      },
      {},
    );

    expect(prisma.modelProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          level: ProfileLevel.DEBUTANT,
          birthDateEncrypted: encrypted('2000-01-01'),
          heightCmEncrypted: encrypted('175'),
        }),
      }),
    );
    expect(encryption.encrypt).toHaveBeenCalledWith('2000-01-01');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'profile.create' }));
    expect(result.birthDate).toBe('2000-01-01');
    expect(result.heightCm).toBe(175);
  });

  it('refuses creating a second profile for the same account', async () => {
    const { service } = createService(buildProfile());

    await expect(
      service.createOwnedProfile(
        'user-1',
        { displayName: 'Awa', birthDate: '2000-01-01', city: 'Cotonou' },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses a profile birth date that belongs to a minor', async () => {
    const { service, prisma, encryption } = createService(null);

    await expect(
      service.createOwnedProfile(
        'user-1',
        { displayName: 'Awa', birthDate: '2015-01-01', city: 'Cotonou' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.modelProfile.create).not.toHaveBeenCalled();
    expect(encryption.encrypt).not.toHaveBeenCalled();
  });

  it('re-checks the age when the birth date is updated', async () => {
    const { service, prisma } = createService(buildProfile());

    await expect(
      service.updateOwnedProfile('user-1', { birthDate: '2015-01-01' }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.modelProfile.update).not.toHaveBeenCalled();
  });

  it('refuses making a beginner profile public', async () => {
    const { service } = createService(buildProfile());

    await expect(
      service.updateOwnedProfile('user-1', { visibility: ProfileVisibility.PUBLIC }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires the three approved guided photos before agency visibility', async () => {
    const { service } = createService(buildProfile());

    await expect(
      service.updateOwnedProfile('user-1', { visibility: ProfileVisibility.VERIFIED_AGENCIES }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows agency visibility after the three guided photos are approved', async () => {
    const { service, prisma } = createService(buildProfile(), [
      PhotoKind.PORTRAIT,
      PhotoKind.FULL_BODY_FRONT,
      PhotoKind.FULL_BODY_PROFILE,
    ]);

    await service.updateOwnedProfile(
      'user-1',
      { visibility: ProfileVisibility.VERIFIED_AGENCIES },
      {},
    );

    expect(prisma.modelProfile.update).toHaveBeenCalled();
    expect(prisma.photo.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: 'profile-1' },
        data: expect.objectContaining({
          visibilityConsent: ProfileVisibility.VERIFIED_AGENCIES,
        }),
      }),
    );
  });
});
