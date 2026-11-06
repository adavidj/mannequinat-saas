import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType, UserStatus } from '@prisma/client';

import { AppConfigService } from '../../config/app-config.service';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

/**
 * Notifications in-app et e-mail.
 *
 * Une notification ne doit jamais faire échouer l'action métier qui la
 * déclenche : l'écriture et l'envoi sont donc tolérants aux pannes et
 * seulement journalisés en cas d'erreur.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: AppConfigService,
  ) {}

  async notify(payload: NotificationPayload): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          link: payload.link ?? null,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Impossible d'enregistrer la notification ${payload.type} pour ${payload.userId}.`,
        error instanceof Error ? error.stack : undefined,
      );
      return;
    }

    const user = await this.prisma.user
      .findUnique({
        where: { id: payload.userId },
        select: { email: true, status: true },
      })
      .catch(() => null);
    if (!user || user.status !== UserStatus.ACTIVE) {
      return;
    }

    const absoluteLink = payload.link
      ? `${this.config.appPublicUrl}${payload.link.startsWith('/') ? '' : '/'}${payload.link}`
      : null;

    try {
      await this.mail.send({
        to: user.email,
        subject: payload.title,
        text: [payload.body, absoluteLink].filter(Boolean).join('\n\n'),
        html: this.renderEmail(payload.title, payload.body, absoluteLink),
      });
    } catch (error: unknown) {
      this.logger.warn(
        `E-mail de notification non envoyé pour ${payload.userId} : ${
          error instanceof Error ? error.message : 'erreur inconnue'
        }`,
      );
    }
  }

  async list(
    userId: string,
    filters: { take: number; skip: number; unreadOnly: boolean },
  ): Promise<{
    items: NotificationItem[];
    total: number;
    unreadCount: number;
    take: number;
    skip: number;
  }> {
    const where = {
      userId,
      ...(filters.unreadOnly ? { readAt: null } : {}),
    };
    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items: notifications.map((notification) => this.toItem(notification)),
      total,
      unreadCount,
      take: filters.take,
      skip: filters.skip,
    };
  }

  async unreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount };
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationItem> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification introuvable.');
    }
    if (notification.readAt) {
      return this.toItem(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
    return this.toItem(updated);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  private toItem(notification: Notification): NotificationItem {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }

  private renderEmail(title: string, body: string, absoluteLink: string | null): string {
    const linkBlock = absoluteLink
      ? `<p style="margin-top:24px"><a href="${this.escape(absoluteLink)}" style="display:inline-block;background:#8a5a2b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none">Ouvrir ModelBénin</a></p>`
      : '';
    return `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.6">
  <h1 style="font-size:20px">${this.escape(title)}</h1>
  <p>${this.escape(body)}</p>
  ${linkBlock}
  <p style="margin-top:32px;font-size:12px;color:#64748b">ModelBénin — Cotonou, Bénin</p>
</div>`;
  }

  private escape(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
