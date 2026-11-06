import { Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, UserStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { NotificationsService } from '../src/modules/notifications/notifications.service';

function buildNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notification-1',
    userId: 'user-1',
    type: NotificationType.MESSAGE_RECEIVED,
    title: 'Nouveau message',
    body: 'Une agence vous a écrit.',
    link: '/dashboard/messages/conversation-1',
    readAt: null,
    createdAt: new Date('2026-11-06T10:00:00.000Z'),
    updatedAt: new Date('2026-11-06T10:00:00.000Z'),
    ...overrides,
  };
}

function createService() {
  const prisma = {
    notification: {
      create: vi.fn().mockResolvedValue(buildNotification()),
      findMany: vi.fn().mockResolvedValue([buildNotification()]),
      findFirst: vi.fn().mockResolvedValue(buildNotification()),
      update: vi.fn().mockResolvedValue(buildNotification({ readAt: new Date() })),
      updateMany: vi.fn().mockResolvedValue({ count: 3 }),
      count: vi.fn().mockResolvedValue(2),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        email: 'awa@example.com',
        status: UserStatus.ACTIVE,
      }),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const mail = { send: vi.fn().mockResolvedValue(undefined) };
  const config = { appPublicUrl: 'https://modelbenin.test' };

  return {
    service: new NotificationsService(prisma as never, mail as never, config as never),
    prisma,
    mail,
  };
}

describe('NotificationsService', () => {
  it('stores an in-app notification and sends the matching e-mail', async () => {
    const { service, prisma, mail } = createService();

    await service.notify({
      userId: 'user-1',
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'Nouveau message',
      body: 'Une agence vous a écrit.',
      link: '/dashboard/messages/conversation-1',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'Nouveau message',
        body: 'Une agence vous a écrit.',
        link: '/dashboard/messages/conversation-1',
      },
    });
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'awa@example.com',
        subject: 'Nouveau message',
        text: expect.stringContaining('https://modelbenin.test/dashboard/messages/conversation-1'),
      }),
    );
  });

  it('keeps the in-app notification but skips e-mail for an inactive account', async () => {
    const { service, prisma, mail } = createService();
    prisma.user.findUnique.mockResolvedValue({
      email: 'awa@example.com',
      status: UserStatus.SUSPENDED,
    });

    await service.notify({
      userId: 'user-1',
      type: NotificationType.ACCOUNT_SUSPENDED,
      title: 'Compte suspendu',
      body: 'Votre compte a été suspendu.',
    });

    expect(prisma.notification.create).toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('never fails the business action when the notification cannot be stored', async () => {
    const { service, prisma, mail } = createService();
    const logger = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    prisma.notification.create.mockRejectedValue(new Error('database down'));

    await expect(
      service.notify({
        userId: 'user-1',
        type: NotificationType.WELCOME,
        title: 'Bienvenue',
        body: 'Bienvenue sur ModelBénin.',
      }),
    ).resolves.toBeUndefined();
    expect(mail.send).not.toHaveBeenCalled();
    expect(logger).toHaveBeenCalled();
    logger.mockRestore();
  });

  it('lists notifications with the total and unread counter', async () => {
    const { service } = createService();

    const result = await service.list('user-1', { take: 20, skip: 0, unreadOnly: false });

    expect(result.items[0]?.id).toBe('notification-1');
    expect(result.unreadCount).toBe(2);
    expect(result.take).toBe(20);
  });

  it('refuses to mark a notification that belongs to another account', async () => {
    const { service, prisma } = createService();
    prisma.notification.findFirst.mockResolvedValue(null);

    await expect(service.markRead('user-1', 'notification-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('marks every unread notification as read', async () => {
    const { service, prisma } = createService();

    const result = await service.markAllRead('user-1');

    expect(result.updated).toBe(3);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});
