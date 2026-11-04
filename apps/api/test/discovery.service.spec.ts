import { ForbiddenException } from '@nestjs/common';
import { PhotoKind, ProfileLevel, ProfileVisibility } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { DiscoveryService } from '../src/modules/discovery/discovery.service';

function createService() {
  const profile = {
    id: 'profile-1',
    displayName: 'Awa',
    city: 'Cotonou',
    level: ProfileLevel.DEBUTANT,
    bio: 'Portfolio débutant',
    photos: [
      {
        id: 'photo-1',
        kind: PhotoKind.PORTRAIT,
        storageKey: 'profiles/profile-1/photos/photo-1.webp',
      },
    ],
  };
  const prisma = {
    modelProfile: {
      findMany: vi.fn().mockResolvedValue([profile]),
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const organizations = {
    requireVerifiedRecruiterOrganization: vi.fn().mockResolvedValue({ id: 'organization-1' }),
  };
  const storage = {
    createDownloadUrl: vi.fn().mockResolvedValue({
      url: 'https://storage.example.test/signed',
      expiresAt: new Date('2026-10-27T00:05:00.000Z'),
    }),
  };
  return {
    service: new DiscoveryService(prisma as never, organizations as never, storage as never),
    prisma,
    organizations,
    storage,
  };
}

describe('DiscoveryService', () => {
  it('requires a verified organization before returning model profiles', async () => {
    const { service, organizations, prisma } = createService();
    organizations.requireVerifiedRecruiterOrganization.mockRejectedValue(
      new ForbiddenException('Organisation non vérifiée.'),
    );

    await expect(service.searchForVerifiedOrganization('agency-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.modelProfile.findMany).not.toHaveBeenCalled();
  });

  it('returns only safe profile fields and signed URLs for approved consented photos', async () => {
    const { service, prisma, storage } = createService();

    const result = await service.searchForVerifiedOrganization('agency-1', {
      city: 'Cotonou',
      take: 20,
      skip: 0,
    });

    expect(prisma.modelProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          visibility: { in: [ProfileVisibility.VERIFIED_AGENCIES, ProfileVisibility.PUBLIC] },
          city: { contains: 'Cotonou', mode: 'insensitive' },
        }),
        select: expect.not.objectContaining({ birthDateEncrypted: expect.anything() }),
      }),
    );
    expect(storage.createDownloadUrl).toHaveBeenCalledWith(
      'profiles/profile-1/photos/photo-1.webp',
    );
    expect(result.items[0]).not.toHaveProperty('birthDate');
    expect(result.items[0]?.photos[0]?.url).toBe('https://storage.example.test/signed');
    expect(result.total).toBe(1);
  });

  it('hides profiles blocked by the model from the requesting organization', async () => {
    const { service, prisma } = createService();

    await service.searchForVerifiedOrganization('agency-1', { take: 20, skip: 0 });

    expect(prisma.modelProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { organizationBlocks: { some: { organizationId: 'organization-1' } } },
        }),
      }),
    );
    expect(prisma.modelProfile.count).toHaveBeenCalled();
  });

  it('passes the selected organization to the access check', async () => {
    const { service, organizations } = createService();

    await service.searchForVerifiedOrganization('agency-1', {
      organizationId: 'organization-2',
      take: 20,
      skip: 0,
    });

    expect(organizations.requireVerifiedRecruiterOrganization).toHaveBeenCalledWith(
      'agency-1',
      'organization-2',
    );
  });
});
