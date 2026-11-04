import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ProfileLevel, ProfileVisibility, UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { AccountService } from '../src/modules/account/account.service';

vi.mock('argon2', () => ({
  argon2id: 2,
  hash: async (value: string) => `hashed:${value}`,
  verify: async (hash: string, value: string) => hash === `hashed:${value}`,
}));

const PASSWORD = 'BonMotDePasse2026!';
const PASSWORD_HASH = `hashed:${PASSWORD}`;

const now = new Date('2026-11-05T10:00:00.000Z');

function buildProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    userId: 'user-1',
    level: ProfileLevel.DEBUTANT,
    displayName: 'Awa',
    birthDateEncrypted: 'enc:1998-01-01',
    city: 'Cotonou',
    heightCmEncrypted: 'enc:175',
    chestCmEncrypted: null,
    waistCmEncrypted: null,
    hipsCmEncrypted: null,
    shoeSizeEncrypted: null,
    visibility: ProfileVisibility.PRIVATE,
    bio: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createService() {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockResolvedValue(undefined),
    },
    modelProfile: {
      findUnique: vi.fn().mockResolvedValue(buildProfile()),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    organization: {
      findMany: vi.fn().mockResolvedValue([{ id: 'org-1' }]),
      deleteMany: vi.fn().mockResolvedValue(undefined),
    },
    photo: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    experience: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    conversation: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue(undefined),
    },
    message: { deleteMany: vi.fn().mockResolvedValue(undefined) },
    profileOrganizationBlock: { deleteMany: vi.fn().mockResolvedValue(undefined) },
    report: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue(undefined),
    },
    subscription: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue(undefined),
    },
    payment: { findMany: vi.fn().mockResolvedValue([]) },
    refreshToken: { deleteMany: vi.fn().mockResolvedValue(undefined) },
    emailVerificationToken: { deleteMany: vi.fn().mockResolvedValue(undefined) },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
  };
  const encryption = {
    decrypt: vi.fn((value: string) => value.replace(/^enc:/, '')),
  };
  const storage = { deleteObject: vi.fn().mockResolvedValue(undefined) };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };

  return {
    service: new AccountService(
      prisma as never,
      encryption as never,
      storage as never,
      audit as never,
    ),
    prisma,
    encryption,
    storage,
    audit,
  };
}

describe('AccountService', () => {
  it('exports decrypted personal data without storage keys', async () => {
    const { service, prisma, audit } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'awa@example.com',
      role: UserRole.MODELE,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    prisma.photo.findMany.mockResolvedValue([
      {
        id: 'photo-1',
        kind: 'PORTRAIT',
        moderationStatus: 'APPROVED',
        visibilityConsent: ProfileVisibility.PRIVATE,
        visibilityConsentAt: now,
        mimeType: 'image/webp',
        sizeBytes: 1024,
        width: 800,
        height: 1000,
        storageKey: 'profiles/profile-1/photo-1.webp',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    prisma.experience.findMany.mockResolvedValue([
      {
        id: 'experience-1',
        title: 'Défilé',
        org: 'Agence Exemple',
        startDate: now,
        endDate: null,
        verified: true,
        proofKey: 'profiles/profile-1/experiences/experience-1/proof.pdf',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    prisma.conversation.findMany.mockResolvedValue([
      {
        id: 'conversation-1',
        organization: { name: 'Agence Exemple', type: 'AGENCY' },
        profile: { displayName: 'Awa' },
        createdAt: now,
        updatedAt: now,
        messages: [
          { id: 'message-1', senderId: 'user-1', body: 'Bonjour', sentAt: now },
          { id: 'message-2', senderId: 'user-2', body: 'Bienvenue', sentAt: now },
        ],
      },
    ]);

    const result = await service.exportAccount('user-1', {});

    expect(result.profile?.birthDate).toBe('1998-01-01');
    expect(result.profile?.heightCm).toBe(175);
    expect(result.photos[0]).not.toHaveProperty('storageKey');
    expect(result.experiences[0].hasProof).toBe(true);
    expect(result.experiences[0]).not.toHaveProperty('proofKey');
    expect(result.conversations[0].messages[0].fromMe).toBe(true);
    expect(result.conversations[0].messages[1].fromMe).toBe(false);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'account.export', actorId: 'user-1' }),
    );
  });

  it('refuses deletion when the password is wrong', async () => {
    const { service, prisma } = createService();
    const passwordHash = PASSWORD_HASH;
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash,
      role: UserRole.MODELE,
      status: UserStatus.ACTIVE,
    });

    await expect(
      service.deleteAccount(
        'user-1',
        { password: 'MauvaisMotDePasse', confirmation: 'SUPPRIMER' },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('purges owned data and anonymizes the account while keeping payments', async () => {
    const { service, prisma, storage, audit } = createService();
    const passwordHash = PASSWORD_HASH;
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash,
      role: UserRole.MODELE,
      status: UserStatus.ACTIVE,
    });
    prisma.photo.findMany.mockResolvedValue([{ storageKey: 'photos/photo-1.webp' }]);
    prisma.experience.findMany.mockResolvedValue([
      { proofKey: 'proofs/experience-1.pdf' },
      { proofKey: null },
    ]);
    prisma.conversation.findMany.mockResolvedValue([{ id: 'conversation-1' }]);

    const result = await service.deleteAccount(
      'user-1',
      { password: 'BonMotDePasse2026!', confirmation: 'SUPPRIMER' },
      {},
    );

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.conversation.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['conversation-1'] } },
    });
    expect(prisma.modelProfile.delete).toHaveBeenCalledWith({ where: { id: 'profile-1' } });
    expect(prisma.organization.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['org-1'] } },
    });
    expect(prisma.subscription.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    // Les paiements ne sont jamais supprimés : obligation comptable.
    expect(prisma).not.toHaveProperty('payment.deleteMany');

    const update = prisma.user.update.mock.calls[0][0];
    expect(update.data.status).toBe(UserStatus.DELETED);
    expect(update.data.email).toBe('deleted-user-1@modelbenin.invalid');
    expect(update.data.emailVerifiedAt).toBeNull();
    expect(update.data.passwordHash).not.toBe(passwordHash);

    expect(storage.deleteObject).toHaveBeenCalledWith('photos/photo-1.webp');
    expect(storage.deleteObject).toHaveBeenCalledWith('proofs/experience-1.pdf');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'account.delete', actorId: 'user-1' }),
    );
    expect(result.message).toContain('supprimé');
  });

  it('prevents the last administrator from deleting their account', async () => {
    const { service, prisma } = createService();
    const passwordHash = PASSWORD_HASH;
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    prisma.user.count.mockResolvedValue(0);

    await expect(
      service.deleteAccount(
        'admin-1',
        { password: 'BonMotDePasse2026!', confirmation: 'SUPPRIMER' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
