import { ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { UsersService } from '../src/modules/users/users.service';

function createService() {
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-2', status: UserStatus.ACTIVE }),
      update: vi.fn().mockResolvedValue({
        id: 'user-2',
        email: 'model@example.com',
        role: UserRole.MODELE,
        status: UserStatus.SUSPENDED,
        emailVerifiedAt: null,
        createdAt: new Date('2026-10-27T00:00:00.000Z'),
        updatedAt: new Date('2026-10-28T00:00:00.000Z'),
      }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  return { service: new UsersService(prisma as never, audit as never), prisma, audit };
}

describe('UsersService admin', () => {
  it('lists users with role, status and email filters', async () => {
    const { service, prisma } = createService();

    await service.listForAdmin({
      role: UserRole.MODELE,
      status: UserStatus.ACTIVE,
      q: 'awa',
      take: 50,
      skip: 0,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: UserRole.MODELE,
          status: UserStatus.ACTIVE,
          email: { contains: 'awa', mode: 'insensitive' },
        },
      }),
    );
  });

  it('suspends an account and revokes its refresh tokens', async () => {
    const { service, prisma, audit } = createService();

    const result = await service.updateStatus(
      'admin-1',
      'user-2',
      { status: UserStatus.SUSPENDED },
      {},
    );

    expect(result.status).toBe(UserStatus.SUSPENDED);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-2', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.status.suspended', actorId: 'admin-1' }),
    );
  });

  it('prevents an admin from suspending their own account', async () => {
    const { service, prisma } = createService();

    await expect(
      service.updateStatus('admin-1', 'admin-1', { status: UserStatus.SUSPENDED }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
