import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Photographie de la plateforme pour le back-office : volumétrie des comptes,
   * des profils et des files de modération, plus les dernières décisions d'audit.
   */
  async stats() {
    const last7Days = new Date(Date.now() - 7 * DAY_MS);
    const last30Days = new Date(Date.now() - 30 * DAY_MS);

    const [
      usersTotal,
      usersActive,
      usersSuspended,
      usersDeleted,
      usersModels,
      usersAgencies,
      usersTrainers,
      usersAdmins,
      usersVerified,
      usersNew7Days,
      usersNew30Days,
      profilesTotal,
      profilesDebutant,
      profilesConfirme,
      visibilityPrivate,
      visibilityVerifiedAgencies,
      visibilityPublic,
      photosPending,
      photosApproved,
      photosRejected,
      experiencesTotal,
      experiencesVerified,
      organizationsPending,
      organizationsVerified,
      organizationsRejected,
      reportsOpen,
      reportsInReview,
      reportsResolved,
      reportsDismissed,
      conversationsTotal,
      messagesTotal,
      messagesLast7Days,
      activity,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { status: 'DELETED' } }),
      this.prisma.user.count({ where: { role: 'MODELE' } }),
      this.prisma.user.count({ where: { role: 'AGENCE' } }),
      this.prisma.user.count({ where: { role: 'FORMATEUR' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      this.prisma.modelProfile.count(),
      this.prisma.modelProfile.count({ where: { level: 'DEBUTANT' } }),
      this.prisma.modelProfile.count({ where: { level: 'CONFIRME' } }),
      this.prisma.modelProfile.count({ where: { visibility: 'PRIVATE' } }),
      this.prisma.modelProfile.count({ where: { visibility: 'VERIFIED_AGENCIES' } }),
      this.prisma.modelProfile.count({ where: { visibility: 'PUBLIC' } }),
      this.prisma.photo.count({ where: { moderationStatus: 'PENDING' } }),
      this.prisma.photo.count({ where: { moderationStatus: 'APPROVED' } }),
      this.prisma.photo.count({ where: { moderationStatus: 'REJECTED' } }),
      this.prisma.experience.count(),
      this.prisma.experience.count({ where: { verified: true } }),
      this.prisma.organization.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.organization.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.organization.count({ where: { verificationStatus: 'REJECTED' } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.report.count({ where: { status: 'IN_REVIEW' } }),
      this.prisma.report.count({ where: { status: 'RESOLVED' } }),
      this.prisma.report.count({ where: { status: 'DISMISSED' } }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.message.count({ where: { sentAt: { gte: last7Days } } }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actor: { select: { id: true, email: true, role: true } },
        },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      users: {
        total: usersTotal,
        active: usersActive,
        suspended: usersSuspended,
        deleted: usersDeleted,
        verified: usersVerified,
        unverified: usersTotal - usersVerified,
        newLast7Days: usersNew7Days,
        newLast30Days: usersNew30Days,
        byRole: {
          MODELE: usersModels,
          AGENCE: usersAgencies,
          FORMATEUR: usersTrainers,
          ADMIN: usersAdmins,
        },
      },
      profiles: {
        total: profilesTotal,
        byLevel: {
          DEBUTANT: profilesDebutant,
          CONFIRME: profilesConfirme,
        },
        byVisibility: {
          PRIVATE: visibilityPrivate,
          VERIFIED_AGENCIES: visibilityVerifiedAgencies,
          PUBLIC: visibilityPublic,
        },
      },
      photos: {
        total: photosPending + photosApproved + photosRejected,
        pending: photosPending,
        approved: photosApproved,
        rejected: photosRejected,
      },
      experiences: {
        total: experiencesTotal,
        pending: experiencesTotal - experiencesVerified,
        verified: experiencesVerified,
      },
      organizations: {
        total: organizationsPending + organizationsVerified + organizationsRejected,
        pending: organizationsPending,
        verified: organizationsVerified,
        rejected: organizationsRejected,
      },
      reports: {
        total: reportsOpen + reportsInReview + reportsResolved + reportsDismissed,
        open: reportsOpen,
        inReview: reportsInReview,
        resolved: reportsResolved,
        dismissed: reportsDismissed,
      },
      messaging: {
        conversations: conversationsTotal,
        messages: messagesTotal,
        messagesLast7Days,
      },
      activity,
    };
  }
}
