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
  const config = { passwordResetTtlMinutes: 30 };

  return {
    service: new TokenService(jwt as never, config as never, prisma as never),
    prisma,
  };
}

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
