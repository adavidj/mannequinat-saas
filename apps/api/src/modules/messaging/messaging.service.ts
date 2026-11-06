import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileVisibility, ReportTargetType, UserRole, VerificationStatus } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateConversationDto, ReportConversationDto, SendMessageDto } from './dto/messaging.dto';

const MAX_NEW_CONVERSATIONS_PER_DAY = 10;

type AuditContext = { ipAddress?: string | null; userAgent?: string | null };

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async createConversation(userId: string, input: CreateConversationDto, context: AuditContext) {
    const organization = await this.organizations.requireVerifiedRecruiterOrganization(
      userId,
      input.organizationId,
    );
    const profile = await this.prisma.modelProfile.findFirst({
      where: {
        id: input.profileId,
        visibility: { in: [ProfileVisibility.VERIFIED_AGENCIES, ProfileVisibility.PUBLIC] },
      },
      select: { id: true, userId: true },
    });
    if (!profile) {
      throw new NotFoundException(
        'Profil introuvable ou non disponible pour les agences vérifiées.',
      );
    }
    await this.assertNotBlocked(profile.id, organization.id);

    const existing = await this.prisma.conversation.findUnique({
      where: {
        organizationId_profileId: { organizationId: organization.id, profileId: profile.id },
      },
    });
    if (existing) {
      return existing;
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const count = await this.prisma.conversation.count({
      where: { organizationId: organization.id, createdAt: { gte: since } },
    });
    if (count >= MAX_NEW_CONVERSATIONS_PER_DAY) {
      throw new HttpException(
        'Quota quotidien de nouvelles conversations atteint.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const conversation = await this.prisma.conversation.create({
      data: { organizationId: organization.id, profileId: profile.id },
    });
    await this.audit.log({
      actorId: userId,
      action: 'conversation.create',
      entityType: 'conversation',
      entityId: conversation.id,
      metadata: { organizationId: organization.id, profileId: profile.id },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    await this.notifications.notify({
      userId: profile.userId,
      type: 'MESSAGE_RECEIVED',
      title: 'Une agence souhaite vous contacter',
      body: 'Une agence vérifiée a ouvert une conversation avec votre profil. Répondez-lui depuis la messagerie.',
      link: `/dashboard/messages/${conversation.id}`,
    });
    return conversation;
  }

  async listConversations(userId: string, role: UserRole) {
    if (role === UserRole.AGENCE) {
      return this.prisma.conversation.findMany({
        where: {
          organization: {
            ownerId: userId,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        },
        include: {
          organization: { select: { id: true, name: true } },
          profile: { select: { id: true, displayName: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }
    if (role === UserRole.MODELE) {
      return this.prisma.conversation.findMany({
        where: { profile: { userId } },
        include: {
          organization: { select: { id: true, name: true } },
          profile: { select: { id: true, displayName: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }
    throw new ForbiddenException('Rôle non autorisé pour la messagerie.');
  }

  async listMessages(userId: string, role: UserRole, conversationId: string) {
    const conversation = await this.getParticipantConversation(userId, role, conversationId);
    if (role === UserRole.AGENCE) {
      await this.organizations.requireVerifiedRecruiterOrganization(
        userId,
        conversation.organizationId,
      );
    }
    return this.prisma.message.findMany({
      where: { conversationId },
      select: { id: true, senderId: true, body: true, sentAt: true },
      orderBy: { sentAt: 'asc' },
      take: 100,
    });
  }

  async sendMessage(
    userId: string,
    role: UserRole,
    conversationId: string,
    input: SendMessageDto,
    context: AuditContext,
  ) {
    this.assertNoContactDetails(input.body);
    const conversation = await this.getParticipantConversation(userId, role, conversationId);
    if (role === UserRole.AGENCE) {
      await this.organizations.requireVerifiedRecruiterOrganization(
        userId,
        conversation.organizationId,
      );
    }
    await this.assertNotBlocked(conversation.profileId, conversation.organizationId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body: input.body },
    });
    await this.audit.log({
      actorId: userId,
      action: 'message.send',
      entityType: 'message',
      entityId: message.id,
      metadata: { conversationId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    const isAgency = role === UserRole.AGENCE;
    await this.notifications.notify({
      userId: isAgency ? conversation.profile.userId : conversation.organization.ownerId,
      type: 'MESSAGE_RECEIVED',
      title: isAgency ? 'Nouveau message d’une agence' : 'Nouveau message d’un modèle',
      body: isAgency
        ? `${conversation.organization.name} vous a envoyé un message.`
        : `${conversation.profile.displayName} vous a envoyé un message.`,
      link: `/dashboard/messages/${conversationId}`,
    });
    return message;
  }

  async blockOrganization(
    userId: string,
    conversationId: string,
    context: AuditContext,
  ): Promise<void> {
    const conversation = await this.getParticipantConversation(
      userId,
      UserRole.MODELE,
      conversationId,
    );
    await this.prisma.profileOrganizationBlock.upsert({
      where: {
        profileId_organizationId: {
          profileId: conversation.profileId,
          organizationId: conversation.organizationId,
        },
      },
      create: { profileId: conversation.profileId, organizationId: conversation.organizationId },
      update: {},
    });
    await this.audit.log({
      actorId: userId,
      action: 'organization.block',
      entityType: 'organization',
      entityId: conversation.organizationId,
      metadata: { conversationId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async unblockOrganization(
    userId: string,
    conversationId: string,
    context: AuditContext,
  ): Promise<void> {
    const conversation = await this.getParticipantConversation(
      userId,
      UserRole.MODELE,
      conversationId,
    );
    await this.prisma.profileOrganizationBlock.deleteMany({
      where: { profileId: conversation.profileId, organizationId: conversation.organizationId },
    });
    await this.audit.log({
      actorId: userId,
      action: 'organization.unblock',
      entityType: 'organization',
      entityId: conversation.organizationId,
      metadata: { conversationId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async listBlockedOrganizations(userId: string) {
    const blocks = await this.prisma.profileOrganizationBlock.findMany({
      where: { profile: { userId } },
      orderBy: { createdAt: 'desc' },
      include: { organization: { select: { id: true, name: true, type: true } } },
    });
    return blocks.map((block) => ({
      organization: block.organization,
      blockedAt: block.createdAt,
    }));
  }

  async reportConversation(
    userId: string,
    role: UserRole,
    conversationId: string,
    input: ReportConversationDto,
    context: AuditContext,
  ) {
    await this.getParticipantConversation(userId, role, conversationId);
    const report = await this.prisma.report.create({
      data: {
        reporterId: userId,
        targetType: ReportTargetType.CONVERSATION,
        targetId: conversationId,
        reason: input.reason,
      },
    });
    await this.audit.log({
      actorId: userId,
      action: 'conversation.report',
      entityType: 'conversation',
      entityId: conversationId,
      metadata: { reportId: report.id },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return { id: report.id, status: report.status };
  }

  private async getParticipantConversation(userId: string, role: UserRole, conversationId: string) {
    if (role !== UserRole.AGENCE && role !== UserRole.MODELE) {
      throw new ForbiddenException('Rôle non autorisé pour la messagerie.');
    }
    const isAgency = role === UserRole.AGENCE;
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ...(isAgency ? { organization: { ownerId: userId } } : { profile: { userId } }),
      },
      select: {
        id: true,
        profileId: true,
        organizationId: true,
        profile: { select: { userId: true, displayName: true } },
        organization: { select: { ownerId: true, name: true } },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable.');
    }
    return conversation;
  }

  private async assertNotBlocked(profileId: string, organizationId: string): Promise<void> {
    const block = await this.prisma.profileOrganizationBlock.findUnique({
      where: { profileId_organizationId: { profileId, organizationId } },
      select: { id: true },
    });
    if (block) {
      throw new ForbiddenException('Cette organisation a été bloquée par le modèle.');
    }
  }

  private assertNoContactDetails(body: string): void {
    const hasEmail = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(body);
    const digitCount = (body.match(/\d/g) ?? []).length;
    if (hasEmail || digitCount >= 8) {
      throw new ForbiddenException(
        'Les coordonnées personnelles ne peuvent pas être partagées dans la messagerie interne.',
      );
    }
  }
}
