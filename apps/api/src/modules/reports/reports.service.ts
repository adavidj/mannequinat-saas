import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportTargetType } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto, ReportQueueQueryDto, UpdateReportDto } from './dto/report.dto';

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createReport(reporterId: string, input: CreateReportDto, context: AuditContext) {
    await this.assertTargetAccessible(reporterId, input.targetType, input.targetId);

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
      },
      select: { id: true, status: true, createdAt: true },
    });

    await this.audit.log({
      actorId: reporterId,
      action: 'report.create',
      entityType: input.targetType.toLowerCase(),
      entityId: input.targetId,
      metadata: { reportId: report.id },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return report;
  }

  async listForAdmin(filters: ReportQueueQueryDto) {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.targetType ? { targetType: filters.targetType } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: filters.take,
        skip: filters.skip,
        include: { reporter: { select: { id: true, email: true, role: true } } },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { items, total, take: filters.take, skip: filters.skip };
  }

  async updateStatus(
    adminId: string,
    reportId: string,
    input: UpdateReportDto,
    context: AuditContext,
  ) {
    const existing = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Signalement introuvable.');
    }

    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: { status: input.status },
      select: { id: true, status: true, updatedAt: true },
    });

    await this.audit.log({
      actorId: adminId,
      action: `report.status.${input.status.toLowerCase()}`,
      entityType: 'report',
      entityId: report.id,
      metadata: { previousStatus: existing.status },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return report;
  }

  private async assertTargetAccessible(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<void> {
    switch (targetType) {
      case ReportTargetType.USER: {
        if (targetId === reporterId) {
          throw new BadRequestException('Vous ne pouvez pas vous signaler vous-même.');
        }
        await this.requireEntity(
          this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } }),
        );
        return;
      }
      case ReportTargetType.PROFILE: {
        await this.requireEntity(
          this.prisma.modelProfile.findUnique({ where: { id: targetId }, select: { id: true } }),
        );
        return;
      }
      case ReportTargetType.ORGANIZATION: {
        await this.requireEntity(
          this.prisma.organization.findUnique({ where: { id: targetId }, select: { id: true } }),
        );
        return;
      }
      case ReportTargetType.PHOTO: {
        await this.requireEntity(
          this.prisma.photo.findUnique({ where: { id: targetId }, select: { id: true } }),
        );
        return;
      }
      case ReportTargetType.CONVERSATION: {
        await this.requireParticipantConversation(reporterId, targetId);
        return;
      }
      case ReportTargetType.MESSAGE: {
        const message = await this.prisma.message.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            conversation: {
              select: {
                profile: { select: { userId: true } },
                organization: { select: { ownerId: true } },
              },
            },
          },
        });
        if (!message) {
          throw new NotFoundException('Message introuvable.');
        }
        if (
          message.conversation.profile.userId !== reporterId &&
          message.conversation.organization.ownerId !== reporterId
        ) {
          throw new ForbiddenException("Vous n'êtes pas participant à cette conversation.");
        }
        return;
      }
      default: {
        throw new BadRequestException('Type de signalement non pris en charge.');
      }
    }
  }

  private async requireParticipantConversation(
    reporterId: string,
    conversationId: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ profile: { userId: reporterId } }, { organization: { ownerId: reporterId } }],
      },
      select: { id: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable.');
    }
  }

  private async requireEntity<T>(query: Promise<T | null>): Promise<T> {
    const entity = await query;
    if (!entity) {
      throw new NotFoundException('Élément signalé introuvable.');
    }
    return entity;
  }
}
