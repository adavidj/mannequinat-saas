import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfileLevel, ProfileVisibility } from '@prisma/client';
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
      findUnique: vi.fn().mockResolvedValue({
        id: 'profile-1',
        level: ProfileLevel.DEBUTANT,
        visibility: ProfileVisibility.PRIVATE,
      }),
      update: vi.fn().mockResolvedValue(undefined),
    },
    experience: {
      create: vi.fn().mockResolvedValue(buildExperience()),
      findMany: vi.fn().mockResolvedValue([buildExperience()]),
      findFirst: vi.fn().mockResolvedValue(buildExperience()),
      findUnique: vi.fn().mockResolvedValue(buildExperience()),
      update: vi.fn().mockResolvedValue(buildExperience()),
      delete: vi.fn().mockResolvedValue(buildExperience()),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const storage = {
    putPrivateFile: vi.fn().mockResolvedValue(undefined),
    deleteObject: vi.fn().mockResolvedValue(undefined),
    createDownloadUrl: vi.fn().mockResolvedValue({
      url: 'https://storage.test/justificatif',
      expiresAt: new Date('2026-10-24T00:05:00.000Z'),
    }),
  };

  return {
    service: new ExperiencesService(prisma as never, storage as never, audit as never),
    prisma,
    storage,
    audit,
  };
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
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'experience.create' }),
    );
  });

  it('rejects an update that makes the existing end date earlier than the new start date', async () => {
    const { service, prisma } = createService();
    prisma.experience.findFirst.mockResolvedValue(
      buildExperience({ endDate: new Date('2025-12-31') }),
    );
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

    await expect(
      service.deleteOwnedExperience('user-1', 'other-experience', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.experience.delete).not.toHaveBeenCalled();
  });

  it('gives admins the unverified experience queue with the model identity', async () => {
    const { service, prisma } = createService();
    prisma.experience.findMany.mockResolvedValue([
      buildExperience({
        profile: {
          id: 'profile-1',
          displayName: 'Awa',
          city: 'Cotonou',
          user: { email: 'awa@example.com' },
        },
      }),
    ]);

    const result = await service.listForReview({ verified: false, take: 50, skip: 0 });

    expect(prisma.experience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { verified: false },
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
    );
    expect(result.items[0]?.profile.user.email).toBe('awa@example.com');
  });

  it('promotes the profile when an admin verifies an experience', async () => {
    const { service, prisma, audit } = createService();
    prisma.experience.update.mockResolvedValue(buildExperience({ verified: true }));
    prisma.experience.count.mockResolvedValue(1);

    const result = await service.reviewExperience(
      'admin-1',
      'experience-1',
      { verified: true },
      {},
    );

    expect(prisma.modelProfile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: { level: ProfileLevel.CONFIRME, visibility: undefined },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', action: 'profile.level.confirmed' }),
    );
    expect(result.verified).toBe(true);
  });

  it('revalidates an edited experience and demotes the profile when no verified experience remains', async () => {
    const { service, prisma } = createService();
    prisma.experience.findFirst.mockResolvedValue(buildExperience({ verified: true }));
    prisma.experience.update.mockResolvedValue(buildExperience({ verified: false }));
    prisma.modelProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      level: ProfileLevel.CONFIRME,
      visibility: ProfileVisibility.PUBLIC,
    });

    await service.updateOwnedExperience('user-1', 'experience-1', { title: 'Nouveau défilé' }, {});

    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ verified: false }) }),
    );
    expect(prisma.modelProfile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: { level: ProfileLevel.DEBUTANT, visibility: ProfileVisibility.PRIVATE },
    });
  });

  it('stores a private proof and resets the verification', async () => {
    const { service, prisma, storage, audit } = createService();
    prisma.experience.findFirst.mockResolvedValue(
      buildExperience({ proofKey: null, verified: true }),
    );
    prisma.experience.update.mockResolvedValue(
      buildExperience({
        proofKey: 'profiles/profile-1/experiences/experience-1/proof.pdf',
        verified: false,
      }),
    );

    const result = await service.uploadOwnedProof(
      'user-1',
      'experience-1',
      { buffer: Buffer.from('%PDF-1.7 justificatif'), mimetype: 'application/pdf', size: 24 },
      {},
    );

    expect(storage.putPrivateFile).toHaveBeenCalledWith(
      expect.stringMatching(/^profiles\/profile-1\/experiences\/experience-1\/.+\.pdf$/),
      expect.any(Buffer),
      'application/pdf',
    );
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ verified: false }) }),
    );
    expect(result.hasProof).toBe(true);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'experience.proof.upload' }),
    );
  });

  it('rejects a proof whose real content does not match an allowed format', async () => {
    const { service, storage } = createService();

    await expect(
      service.uploadOwnedProof(
        'user-1',
        'experience-1',
        {
          buffer: Buffer.from('<html>pas un justificatif</html>'),
          mimetype: 'text/html',
          size: 30,
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.putPrivateFile).not.toHaveBeenCalled();
  });

  it('lets an admin open a proof and traces the access', async () => {
    const { service, prisma, storage, audit } = createService();
    prisma.experience.findUnique.mockResolvedValue({
      id: 'experience-1',
      profileId: 'profile-1',
      proofKey: 'profiles/profile-1/experiences/experience-1/proof.pdf',
    });

    const result = await service.getReviewProofUrl('admin-1', 'experience-1', {});

    expect(storage.createDownloadUrl).toHaveBeenCalledWith(
      'profiles/profile-1/experiences/experience-1/proof.pdf',
      'application/pdf',
    );
    expect(result.contentType).toBe('application/pdf');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', action: 'experience.proof.viewed' }),
    );
  });

  it('returns a not found error when an experience has no proof', async () => {
    const { service, prisma, storage } = createService();
    prisma.experience.findFirst.mockResolvedValue(buildExperience({ proofKey: null }));

    await expect(service.getOwnedProofUrl('user-1', 'experience-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.createDownloadUrl).not.toHaveBeenCalled();
  });
});
