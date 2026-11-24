import { describe, expect, it, vi } from 'vitest';

import { TokenService } from '../src/modules/auth/services/token.service';

function createService() {
  const now = Date.now();
  const prisma = {
    passwordResetToken: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({ id: 'reset-1' }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(now + 30 * 60_000),
      }),
      update: vi.fn().mockResolvedValue({ id: 'reset-1' }),
    },
  };
  const jwt = { sign: vi.fn().mockReturnValue('access-token') };
  const config = { passwordResetTtlMinutes: 30, jwtRefreshTtlMs: 7 * 24 * 60 * 60_000 };
  const encryption = {
    encrypt: vi.fn((value: string) => `enc:${value}`),
    decrypt: vi.fn((value: string) => value.replace(/^enc:/, '')),
  };

  return {
    service: new TokenService(
      jwt as never,
      config as never,
      prisma as never,
      encryption as never,
    ),
    prisma,
    encryption,
  };
}

describe('TokenService refresh rotation', () => {
  function refreshPrisma(record: Record<string, unknown> | null) {
    return {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue(record),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
      },
    };
  }

  it('révoque le jeton présenté et crée un remplaçant dans la même famille', async () => {
    const now = Date.now();
    const prisma = refreshPrisma({
      id: 'rt-1',
      userId: 'user-1',
      familyId: 'family-1',
      revokedAt: null,
      replacedAt: null,
      replacedByTokenEncrypted: null,
      expiresAt: new Date(now + 60_000),
    });
    const service = new TokenService(
      { sign: vi.fn() } as never,
      { jwtRefreshTtlMs: 7 * 24 * 60 * 60_000 } as never,
      prisma as never,
      { encrypt: (v: string) => `enc:${v}`, decrypt: (v: string) => v } as never,
    );

    const result = await service.rotateRefreshToken('jeton');

    expect(result?.userId).toBe('user-1');
    expect(result?.refreshToken).toMatch(/^[0-9a-f]{96}$/);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'rt-1', revokedAt: null, expiresAt: { gt: expect.any(Date) } },
      data: {
        revokedAt: expect.any(Date),
        replacedAt: expect.any(Date),
        replacedByTokenEncrypted: expect.stringMatching(/^enc:/),
      },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', familyId: 'family-1' }),
    });
  });

  it('renvoie le même remplaçant à deux requêtes parallèles', async () => {
    const now = Date.now();
    const prisma = refreshPrisma({
      id: 'rt-1',
      userId: 'user-1',
      familyId: 'family-1',
      revokedAt: null,
      replacedAt: null,
      replacedByTokenEncrypted: null,
      expiresAt: new Date(now + 60_000),
    });
    // La course est perdue : la ligne a déjà été révoquée par l'autre requête.
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.refreshToken.findUnique
      .mockResolvedValueOnce({
        id: 'rt-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        replacedAt: null,
        replacedByTokenEncrypted: null,
        expiresAt: new Date(now + 60_000),
      })
      .mockResolvedValueOnce({
        id: 'rt-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: new Date(now - 1_000),
        replacedAt: new Date(now - 1_000),
        replacedByTokenEncrypted: 'enc:remplacant',
        expiresAt: new Date(now + 60_000),
      });

    const service = new TokenService(
      { sign: vi.fn() } as never,
      { jwtRefreshTtlMs: 7 * 24 * 60 * 60_000 } as never,
      prisma as never,
      { encrypt: (v: string) => `enc:${v}`, decrypt: (v: string) => v.replace(/^enc:/, '') } as never,
    );

    const result = await service.rotateRefreshToken('jeton');

    expect(result).toEqual({ userId: 'user-1', refreshToken: 'remplacant' });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
  });

  it('révoque toute la famille quand un jeton est réutilisé hors délai', async () => {
    const now = Date.now();
    const prisma = refreshPrisma({
      id: 'rt-1',
      userId: 'user-1',
      familyId: 'family-1',
      revokedAt: new Date(now - 10 * 60_000),
      replacedAt: new Date(now - 10 * 60_000),
      replacedByTokenEncrypted: 'enc:ancien',
      expiresAt: new Date(now + 60_000),
    });
    const service = new TokenService(
      { sign: vi.fn() } as never,
      { jwtRefreshTtlMs: 7 * 24 * 60 * 60_000 } as never,
      prisma as never,
      { encrypt: (v: string) => `enc:${v}`, decrypt: (v: string) => v } as never,
    );

    const result = await service.rotateRefreshToken('jeton');

    expect(result).toBeNull();
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: { revokedAt: expect.any(Date), replacedByTokenEncrypted: null },
    });
  });
});

describe('TokenService password reset tokens', () => {
  it('invalidates previous unused tokens before issuing a new one', async () => {
    const { service, prisma } = createService();

    const token = await service.issuePasswordReset('user-1');

    expect(token).toMatch(/^[0-9a-f]{96}$/);
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('marks a token as used when it is consumed', async () => {
    const { service, prisma } = createService();

    const result = await service.consumePasswordResetToken('plain-token');

    expect(result).toEqual({ userId: 'user-1' });
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'reset-1' },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('refuses an already used token', async () => {
    const { service, prisma } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.consumePasswordResetToken('plain-token')).resolves.toBeNull();
    expect(prisma.passwordResetToken.update).not.toHaveBeenCalled();
  });

  it('refuses an expired token', async () => {
    const { service, prisma } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(service.consumePasswordResetToken('plain-token')).resolves.toBeNull();
  });
});
