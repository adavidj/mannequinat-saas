import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ExperiencesService } from '../src/modules/profiles/experiences.service';

function buildExperience(overrides: Record<string, unknown> = {}) {
  return {
    id: 'experience-1',
    profileId: 'profile-1',
    title: 'Défilé de mode',
    org: 'Agence Exemple',
    startDate: new Date('2025-01-01'),
    endDate: null,
    proofKey: 'private/proof.pdf',
    verified: false,
    createdAt: new Date('2026-10-24T00:00:00.000Z'),
    updatedAt: new Date('2026-10-24T00:00:00.000Z'),
    ...overrides,
  };
}

function createService() {
  const prisma = {
    modelProfile: {
      findUnique: vi.fn().mockResolvedValue({ id: 'profile-1' }),
    },
    experience: {
      create: vi.fn().mockResolvedValue(buildExperience()),
      findMany: vi.fn().mockResolvedValue([buildExperience()]),
      findFirst: vi.fn().mockResolvedValue(buildExperience()),
      update: vi.fn().mockResolvedValue(buildExperience()),
      delete: vi.fn().mockResolvedValue(buildExperience()),
    },
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };

  return { service: new ExperiencesService(prisma as never, audit as never), prisma, audit };
}

describe('ExperiencesService', () => {
  it('creates an unverified experience and never exposes a proof key', async () => {
    const { service, prisma, audit } = createService();

    const result = await service.createOwnedExperience(
      'user-1',
      {
        title: 'Défilé de mode',
        org: 'Agence Exemple',
        startDate: new Date('2025-01-01'),
      },
      {},
    );

    expect(prisma.experience.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profileId: 'profile-1' }),
      }),
    );
    expect(result).not.toHaveProperty('proofKey');
    expect(result.verified).toBe(false);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'experience.create' }));
  });

  it('rejects an update that makes the existing end date earlier than the new start date', async () => {
    const { service, prisma } = createService();
    prisma.experience.findFirst.mockResolvedValue(buildExperience({ endDate: new Date('2025-12-31') }));
    // Une expérience terminée ne peut pas être déplacée après sa propre date de fin.
    await expect(
      service.updateOwnedExperience(
        'user-1',
        'experience-1',
        { startDate: new Date('2026-01-01') },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not let an owner access another profile experience', async () => {
    const { service, prisma } = createService();
    prisma.experience.findFirst.mockResolvedValue(null);

    await expect(service.deleteOwnedExperience('user-1', 'other-experience', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.experience.delete).not.toHaveBeenCalled();
  });
});
