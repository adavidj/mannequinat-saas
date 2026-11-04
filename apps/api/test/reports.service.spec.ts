import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { ReportsService } from '../src/modules/reports/reports.service';

function createService() {
  const prisma = {
    report: {
      create: vi.fn().mockResolvedValue({
        id: 'report-1',
        status: ReportStatus.OPEN,
        createdAt: new Date('2026-10-27T00:00:00.000Z'),
      }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue({ id: 'report-1', status: ReportStatus.OPEN }),
      update: vi.fn().mockResolvedValue({
        id: 'report-1',
        status: ReportStatus.RESOLVED,
        updatedAt: new Date('2026-10-28T00:00:00.000Z'),
      }),
    },
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user-2' }) },
    modelProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'profile-1' }) },
    organization: { findUnique: vi.fn().mockResolvedValue({ id: 'organization-1' }) },
    photo: { findUnique: vi.fn().mockResolvedValue({ id: 'photo-1' }) },
    message: { findUnique: vi.fn().mockResolvedValue(null) },
    conversation: { findFirst: vi.fn().mockResolvedValue({ id: 'conversation-1' }) },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  return { service: new ReportsService(prisma as never, audit as never), prisma, audit };
}

describe('ReportsService', () => {
  it('creates a report for an existing profile and records it', async () => {
    const { service, prisma, audit } = createService();

    const result = await service.createReport(
      'user-1',
      {
        targetType: ReportTargetType.PROFILE,
        targetId: 'profile-1',
        reason: 'Photos volées et comportement suspect.',
      },
      {},
    );

    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: 'user-1',
          targetType: ReportTargetType.PROFILE,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'report.create', entityId: 'profile-1' }),
    );
    expect(result.status).toBe(ReportStatus.OPEN);
  });

  it('refuses a user reporting their own account', async () => {
    const { service, prisma } = createService();

    await expect(
      service.createReport(
        'user-1',
        { targetType: ReportTargetType.USER, targetId: 'user-1', reason: 'Auto-signalement.' },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('refuses reporting a message from a conversation the user does not belong to', async () => {
    const { service, prisma } = createService();
    prisma.message.findUnique.mockResolvedValue({
      id: 'message-1',
      conversation: {
        profile: { userId: 'someone-else' },
        organization: { ownerId: 'another-agency' },
      },
    });

    await expect(
      service.createReport(
        'user-1',
        {
          targetType: ReportTargetType.MESSAGE,
          targetId: 'message-1',
          reason: 'Message menaçant et insistants.',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists the admin queue and updates a report status with an audit entry', async () => {
    const { service, prisma, audit } = createService();
    prisma.report.findMany.mockResolvedValue([
      {
        id: 'report-1',
        status: ReportStatus.OPEN,
        reporter: { id: 'user-1', email: 'user@example.com', role: 'MODELE' },
      },
    ]);

    const queue = await service.listForAdmin({ status: ReportStatus.OPEN, take: 50, skip: 0 });
    const updated = await service.updateStatus(
      'admin-1',
      'report-1',
      { status: ReportStatus.RESOLVED },
      {},
    );

    expect(queue.total).toBe(0);
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: ReportStatus.OPEN } }),
    );
    expect(updated.status).toBe(ReportStatus.RESOLVED);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'report.status.resolved', actorId: 'admin-1' }),
    );
  });
});
