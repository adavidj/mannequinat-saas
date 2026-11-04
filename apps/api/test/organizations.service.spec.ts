import { ForbiddenException } from '@nestjs/common';
import { OrganizationType, UserRole, VerificationStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { OrganizationsService } from '../src/modules/organizations/organizations.service';

const encrypted = (value: string) => `v1:${value}`;
const decrypted = (value: string) => value.replace('v1:', '');

function buildOrganization(overrides: Record<string, unknown> = {}) {
  return {
    id: 'organization-1',
    ownerId: 'agency-1',
    type: OrganizationType.AGENCY,
    name: 'Agence Exemple',
    ifuEncrypted: encrypted('IFU-123'),
    rccmEncrypted: null,
    verificationStatus: VerificationStatus.PENDING,
    createdAt: new Date('2026-10-27T00:00:00.000Z'),
    updatedAt: new Date('2026-10-27T00:00:00.000Z'),
    owner: { id: 'agency-1', email: 'agence@example.com' },
    ...overrides,
  };
}

function createService() {
  const prisma = {
    organization: {
      create: vi.fn().mockResolvedValue(buildOrganization()),
      findMany: vi.fn().mockResolvedValue([buildOrganization()]),
      findUnique: vi.fn().mockResolvedValue(buildOrganization()),
      update: vi
        .fn()
        .mockResolvedValue(buildOrganization({ verificationStatus: VerificationStatus.VERIFIED })),
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const encryption = { encrypt: vi.fn(encrypted), decrypt: vi.fn(decrypted) };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new OrganizationsService(prisma as never, encryption as never, audit as never),
    prisma,
    encryption,
    audit,
  };
}

describe('OrganizationsService', () => {
  it('encrypts legal identifiers and creates a pending agency organization', async () => {
    const { service, prisma, encryption, audit } = createService();

    const result = await service.createOwnedOrganization(
      'agency-1',
      UserRole.AGENCE,
      { type: OrganizationType.AGENCY, name: 'Agence Exemple', ifu: 'IFU-123' },
      {},
    );

    expect(encryption.encrypt).toHaveBeenCalledWith('IFU-123');
    expect(prisma.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verificationStatus: VerificationStatus.PENDING }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'organization.create' }),
    );
    expect(result.ifu).toBe('IFU-123');
  });

  it('rejects an organization type that does not match the account role', async () => {
    const { service, prisma } = createService();

    await expect(
      service.createOwnedOrganization(
        'agency-1',
        UserRole.AGENCE,
        { type: OrganizationType.TRAINING_ORGANIZATION, name: 'Formation Exemple', ifu: 'IFU-123' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.organization.create).not.toHaveBeenCalled();
  });

  it('gives admins the pending queue with decrypted legal identifiers', async () => {
    const { service, prisma } = createService();

    const result = await service.listForReview(
      'admin-1',
      { verificationStatus: VerificationStatus.PENDING, take: 50, skip: 0 },
      {},
    );

    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { verificationStatus: VerificationStatus.PENDING },
        include: { owner: { select: { id: true, email: true } } },
      }),
    );
    expect(result.items[0]?.ifu).toBe('IFU-123');
    expect(result.items[0]?.owner.email).toBe('agence@example.com');
    expect(result.total).toBe(1);
  });

  it('lets an admin verify an organization and records the decision', async () => {
    const { service, prisma, audit } = createService();

    const result = await service.reviewOrganization(
      'admin-1',
      'organization-1',
      { verificationStatus: VerificationStatus.VERIFIED },
      {},
    );

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'organization-1' },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', action: 'organization.verification.verified' }),
    );
    expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
  });
});
