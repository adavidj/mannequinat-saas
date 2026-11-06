import { ForbiddenException } from '@nestjs/common';
import { ProfileVisibility, UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { MessagingService } from '../src/modules/messaging/messaging.service';

function createService() {
  const prisma = {
    modelProfile: {
      findFirst: vi.fn().mockResolvedValue({ id: 'profile-1' }),
    },
    conversation: {
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({
        id: 'conversation-1',
        profileId: 'profile-1',
        organizationId: 'organization-1',
      }),
      findFirst: vi.fn().mockResolvedValue({
        id: 'conversation-1',
        profileId: 'profile-1',
        organizationId: 'organization-1',
        profile: { userId: 'model-user', displayName: 'Awa' },
        organization: { ownerId: 'agency-1', name: 'Agence Exemple' },
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    profileOrganizationBlock: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    message: {
      create: vi.fn().mockResolvedValue({ id: 'message-1', body: 'Bonjour', senderId: 'agency-1' }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    report: { create: vi.fn().mockResolvedValue({ id: 'report-1', status: 'OPEN' }) },
  };
  const organizations = {
    requireVerifiedRecruiterOrganization: vi.fn().mockResolvedValue({ id: 'organization-1' }),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const notifications = { notify: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new MessagingService(
      prisma as never,
      organizations as never,
      audit as never,
      notifications as never,
    ),
    prisma,
    organizations,
    audit,
    notifications,
  };
}

describe('MessagingService', () => {
  it('requires a verified organization before creating a conversation', async () => {
    const { service, organizations, prisma } = createService();
    organizations.requireVerifiedRecruiterOrganization.mockRejectedValue(new ForbiddenException());

    await expect(
      service.createConversation('agency-1', { profileId: 'profile-1' }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.modelProfile.findFirst).not.toHaveBeenCalled();
  });

  it('enforces a daily quota before creating a new conversation', async () => {
    const { service, prisma } = createService();
    prisma.conversation.count.mockResolvedValue(10);

    await expect(
      service.createConversation('agency-1', { profileId: 'profile-1' }, {}),
    ).rejects.toThrow('Quota quotidien de nouvelles conversations atteint.');
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('does not send a message when the organization is blocked', async () => {
    const { service, prisma } = createService();
    prisma.profileOrganizationBlock.findUnique.mockResolvedValue({ id: 'block-1' });

    await expect(
      service.sendMessage('agency-1', UserRole.AGENCE, 'conversation-1', { body: 'Bonjour' }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('rejects obvious contact details in messages', async () => {
    const { service, prisma } = createService();

    await expect(
      service.sendMessage(
        'agency-1',
        UserRole.AGENCE,
        'conversation-1',
        { body: 'Contactez-moi à contact@example.com' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.conversation.findFirst).not.toHaveBeenCalled();
  });

  it('lets a model unblock an organization and records the action', async () => {
    const { service, prisma, audit } = createService();

    await service.unblockOrganization('model-user', 'conversation-1', {});

    expect(prisma.profileOrganizationBlock.deleteMany).toHaveBeenCalledWith({
      where: { profileId: 'profile-1', organizationId: 'organization-1' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'organization.unblock', entityId: 'organization-1' }),
    );
  });

  it('lists the organizations blocked by a model', async () => {
    const { service, prisma } = createService();
    prisma.profileOrganizationBlock.findMany.mockResolvedValue([
      {
        organization: { id: 'organization-1', name: 'Agence Exemple', type: 'AGENCY' },
        createdAt: new Date('2026-10-27T00:00:00.000Z'),
      },
    ]);

    const result = await service.listBlockedOrganizations('model-user');

    expect(prisma.profileOrganizationBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profile: { userId: 'model-user' } } }),
    );
    expect(result[0]?.organization.name).toBe('Agence Exemple');
  });

  it('queries only profiles available to verified agencies', async () => {
    const { service, prisma } = createService();

    await service.createConversation('agency-1', { profileId: 'profile-1' }, {});

    expect(prisma.modelProfile.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'profile-1',
        visibility: { in: [ProfileVisibility.VERIFIED_AGENCIES, ProfileVisibility.PUBLIC] },
      },
      select: { id: true, userId: true },
    });
  });
});
