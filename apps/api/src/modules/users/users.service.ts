import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ListUsersDto, UpdateUserStatusDto } from './dto/admin-user.dto';

type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

const USER_LIST_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(input: { email: string; passwordHash: string; role: UserRole }) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        status: UserStatus.ACTIVE,
      },
    });
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async listForAdmin(filters: ListUsersDto) {
    const where = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q ? { email: { contains: filters.q, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
        select: USER_LIST_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, take: filters.take, skip: filters.skip };
  }

  async updateStatus(
    actorId: string,
    userId: string,
    input: UpdateUserStatusDto,
    context: AuditContext,
  ) {
    if (actorId === userId) {
      throw new ForbiddenException('Un administrateur ne peut pas suspendre son propre compte.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Compte introuvable.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: input.status },
      select: USER_LIST_SELECT,
    });

    if (input.status === UserStatus.SUSPENDED) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.audit.log({
      actorId,
      action: `user.status.${input.status.toLowerCase()}`,
      entityType: 'user',
      entityId: user.id,
      metadata: { previousStatus: existing.status },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    if (existing.status !== input.status) {
      const suspended = input.status === UserStatus.SUSPENDED;
      await this.notifications.notify({
        userId: user.id,
        type: suspended ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
        title: suspended ? 'Compte suspendu' : 'Compte réactivé',
        body: suspended
          ? 'Votre compte a été suspendu par notre équipe de modération. Contactez le support si vous pensez qu’il s’agit d’une erreur.'
          : 'Votre compte a été réactivé. Vous pouvez à nouveau utiliser votre espace ModelBénin.',
        link: suspended ? null : '/dashboard',
      });
    }

    return user;
  }
}
