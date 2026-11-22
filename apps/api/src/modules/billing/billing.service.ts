import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BillingInterval,
  PaymentProvider,
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';

import { AppConfigService, type BillingMode } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BillingPlan, findPlan, plansForAudience } from './billing.catalog';
import { BillingGateway, GatewayCheckout } from './billing.gateway';
import { CreateCheckoutDto } from './dto/billing.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

export const INTERVAL_LABELS: Record<BillingInterval, string> = {
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel',
};

export type SubscriptionView = {
  id: string;
  plan: SubscriptionPlan;
  planName: string;
  interval: BillingInterval;
  intervalLabel: string;
  status: SubscriptionStatus;
  priceFcfa: number | null;
  startsAt: string | null;
  renewAt: string | null;
  endsAt: string | null;
  /** Résilié mais encore actif jusqu'à la fin de la période payée. */
  cancelAtPeriodEnd: boolean;
};

export type PaymentView = {
  id: string;
  invoiceNumber: string | null;
  amountFcfa: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  description: string | null;
  plan: SubscriptionPlan | null;
  interval: BillingInterval | null;
  createdAt: string;
  paidAt: string | null;
};

export type InvoiceView = {
  number: string;
  issuedAt: string;
  paidAt: string | null;
  status: PaymentStatus;
  amountFcfa: number;
  currency: 'XOF';
  description: string;
  planName: string | null;
  intervalLabel: string | null;
  provider: PaymentProvider;
  providerReference: string;
  customer: { email: string };
  seller: { name: string; address: string; contact: string };
  period: { startsAt: string | null; renewAt: string | null } | null;
};

export type BillingOverview = {
  generatedAt: string;
  mode: BillingMode;
  simulation: boolean;
  provider: 'SIMULATED' | 'FEDAPAY';
  plans: BillingPlan[];
  subscription: SubscriptionView | null;
  payments: PaymentView[];
  totalPayments: number;
};

export type CheckoutResult = {
  payment: PaymentView;
  checkout: GatewayCheckout;
};

function addInterval(from: Date, interval: BillingInterval): Date {
  const days = interval === BillingInterval.YEARLY ? 365 : 30;
  return new Date(from.getTime() + days * DAY_MS);
}

function audienceForRole(role: UserRole): BillingPlan['audience'] | null {
  if (role === UserRole.MODELE) {
    return 'MODELE';
  }
  if (role === UserRole.AGENCE) {
    return 'AGENCE';
  }
  return null;
}

function friendlyDate(value: Date | null | undefined): string {
  if (!value) {
    return '—';
  }
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(value);
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly gateway: BillingGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async overview(
    userId: string,
    options: { take?: number; skip?: number } = {},
  ): Promise<BillingOverview> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }

    await this.expireOutdated(userId);
    const audience = audienceForRole(user.role);

    const [subscription, payments, totalPayments] = await this.prisma.$transaction([
      this.prisma.subscription.findFirst({
        where: { userId, status: { not: SubscriptionStatus.EXPIRED } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: options.take ?? 30,
        skip: options.skip ?? 0,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    const mode = this.config.billingMode;
    return {
      generatedAt: new Date().toISOString(),
      mode,
      simulation: mode === 'simulation',
      provider: mode === 'live' ? 'FEDAPAY' : 'SIMULATED',
      plans: audience ? plansForAudience(audience) : [],
      subscription: subscription ? this.toSubscriptionView(subscription) : null,
      payments: payments.map((payment) => this.toPaymentView(payment)),
      totalPayments,
    };
  }

  async checkout(userId: string, dto: CreateCheckoutDto): Promise<CheckoutResult> {
    if (this.config.billingMode === 'disabled') {
      throw new ServiceUnavailableException(
        'Les paiements sont temporairement désactivés. Réessayez plus tard.',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Ce compte ne peut pas souscrire à un abonnement.');
    }

    const plan = findPlan(dto.plan as SubscriptionPlan);
    if (!plan) {
      throw new BadRequestException('Formule inconnue.');
    }
    const audience = audienceForRole(user.role);
    if (!audience) {
      throw new ForbiddenException(
        'Les abonnements sont réservés aux modèles et aux agences. Les organismes de formation disposent d’un accès gratuit.',
      );
    }
    if (plan.audience !== audience) {
      throw new ForbiddenException('Cette formule ne correspond pas à votre espace.');
    }

    const interval = dto.interval as BillingInterval;
    const price = plan.prices[interval];
    if (price === null) {
      throw new BadRequestException('Cette formule n’est pas proposée à ce rythme de paiement.');
    }

    const existing = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            SubscriptionStatus.PENDING,
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.CANCELED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const subscription =
      existing ??
      (await this.prisma.subscription.create({
        data: {
          userId,
          plan: plan.code,
          interval,
          status: SubscriptionStatus.PENDING,
        },
      }));

    const reference = `MBP-${randomUUID()}`;
    const year = new Date().getUTCFullYear();
    const invoiceNumber = `MB-${year}-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const description = `${plan.name} — abonnement ${INTERVAL_LABELS[interval].toLowerCase()}`;

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amountFcfa: price,
        provider:
          this.config.billingMode === 'live'
            ? PaymentProvider.FEDAPAY
            : PaymentProvider.SIMULATED,
        providerReference: reference,
        status: PaymentStatus.PENDING,
        idempotencyKey: `checkout:${reference}`,
        plan: plan.code,
        interval,
        description,
        invoiceNumber,
      },
    });

    let checkout: GatewayCheckout;
    try {
      checkout = await this.gateway.createCheckout({
        paymentId: payment.id,
        reference,
        amountFcfa: price,
        description,
        customerEmail: user.email,
        planCode: plan.code,
        interval,
      });
    } catch (error: unknown) {
      await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      });
      throw error;
    }

    const updated =
      checkout.provider === payment.provider
        ? payment
        : await this.prisma.payment.update({
            where: { id: payment.id },
            data: { provider: checkout.provider },
          });

    return { payment: this.toPaymentView(updated), checkout };
  }

  /** Confirmation d'un paiement simulé, réservée au développement. */
  async confirmSimulatedPayment(
    userId: string,
    paymentId: string,
  ): Promise<{ status: PaymentStatus; activated: boolean }> {
    if (this.config.billingMode !== 'simulation') {
      throw new ForbiddenException('La confirmation simulée est désactivée.');
    }
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
      select: { id: true, provider: true, status: true },
    });
    if (!payment) {
      throw new NotFoundException('Paiement introuvable.');
    }
    if (payment.provider !== PaymentProvider.SIMULATED) {
      throw new BadRequestException('Ce paiement doit être confirmé par le prestataire.');
    }
    const result = await this.markSucceeded(payment.id);
    return { status: PaymentStatus.SUCCEEDED, activated: result.activated };
  }

  async cancel(userId: string): Promise<BillingOverview> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING, SubscriptionStatus.PAST_DUE],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) {
      throw new NotFoundException('Aucun abonnement actif à résilier.');
    }

    const now = new Date();
    const endsAt =
      subscription.status === SubscriptionStatus.ACTIVE ? (subscription.renewAt ?? now) : now;
    const status =
      endsAt.getTime() > now.getTime() ? SubscriptionStatus.CANCELED : SubscriptionStatus.EXPIRED;

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status, endsAt },
      }),
      this.prisma.payment.updateMany({
        where: { subscriptionId: subscription.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.CANCELED },
      }),
    ]);

    await this.notifications.notify({
      userId,
      type: 'SUBSCRIPTION_CANCELED',
      title: 'Abonnement résilié',
      body:
        status === SubscriptionStatus.EXPIRED
          ? 'Votre abonnement est terminé. Vous conservez votre profil gratuit.'
          : `Votre abonnement reste actif jusqu’au ${friendlyDate(endsAt)}, puis votre profil repasse en formule gratuite.`,
      link: '/dashboard/abonnement',
    });

    return this.overview(userId);
  }

  async invoice(userId: string, paymentId: string): Promise<InvoiceView> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: {
        subscription: { select: { startsAt: true, renewAt: true } },
        user: { select: { email: true } },
      },
    });
    if (!payment) {
      throw new NotFoundException('Facture introuvable.');
    }

    const plan = payment.plan ? findPlan(payment.plan) : null;
    return {
      number:
        payment.invoiceNumber ??
        `MB-${payment.createdAt.getUTCFullYear()}-${payment.id.slice(-8).toUpperCase()}`,
      issuedAt: payment.createdAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      status: payment.status,
      amountFcfa: payment.amountFcfa,
      currency: 'XOF',
      description: payment.description ?? 'Abonnement ModelBénin',
      planName: plan?.name ?? null,
      intervalLabel: payment.interval ? INTERVAL_LABELS[payment.interval] : null,
      provider: payment.provider,
      providerReference: payment.providerReference,
      customer: { email: payment.user.email },
      seller: {
        name: 'ModelBénin',
        address: 'Cotonou, Bénin',
        contact: 'facturation@modelbenin.bj',
      },
      period: payment.subscription
        ? {
            startsAt: payment.subscription.startsAt?.toISOString() ?? null,
            renewAt: payment.subscription.renewAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  async handleWebhook(
    provider: string,
    rawBody: string,
    signature: string | null,
    payload: unknown,
  ): Promise<{ ok: true; processed: boolean; reason?: string }> {
    if (provider.toLowerCase() !== 'fedapay') {
      throw new NotFoundException('Prestataire de paiement inconnu.');
    }
    if (!this.gateway.verifyWebhook(rawBody, signature)) {
      throw new UnauthorizedException('Signature de webhook invalide.');
    }

    const reference = this.gateway.extractReference(payload);
    if (!reference) {
      return { ok: true, processed: false, reason: 'référence absente' };
    }
    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: reference },
      select: { id: true, provider: true, status: true },
    });
    if (!payment || payment.provider !== PaymentProvider.FEDAPAY) {
      return { ok: true, processed: false, reason: 'paiement inconnu' };
    }

    const status = this.gateway.extractStatus(payload);
    if (status === 'succeeded') {
      const result = await this.markSucceeded(payment.id);
      return { ok: true, processed: result.activated || result.alreadyProcessed };
    }
    if (status === 'failed' || status === 'canceled') {
      const updated = await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: status === 'failed' ? PaymentStatus.FAILED : PaymentStatus.CANCELED,
        },
      });
      return { ok: true, processed: updated.count > 0 };
    }
    return { ok: true, processed: false, reason: 'statut non terminal' };
  }

  private async markSucceeded(
    paymentId: string,
  ): Promise<{ activated: boolean; alreadyProcessed: boolean }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        subscriptionId: true,
        status: true,
        plan: true,
        interval: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Paiement introuvable.');
    }
    if (payment.status === PaymentStatus.SUCCEEDED) {
      return { activated: false, alreadyProcessed: true };
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Ce paiement ne peut plus être confirmé.');
    }

    const now = new Date();
    let activated = false;

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.SUCCEEDED, paidAt: now },
      });
      if (claimed.count === 0 || !payment.subscriptionId) {
        return;
      }

      const subscription = await tx.subscription.findUnique({
        where: { id: payment.subscriptionId },
      });
      if (!subscription) {
        return;
      }

      const interval = payment.interval ?? subscription.interval;
      const base =
        subscription.renewAt && subscription.renewAt.getTime() > now.getTime()
          ? subscription.renewAt
          : now;

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          plan: payment.plan ?? subscription.plan,
          interval,
          startsAt: subscription.startsAt ?? now,
          renewAt: addInterval(base, interval),
          endsAt: null,
        },
      });
      activated = true;
    });

    if (activated && payment.subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
        select: { plan: true, interval: true, renewAt: true },
      });
      const plan = subscription ? findPlan(subscription.plan) : null;
      await this.notifications.notify({
        userId: payment.userId,
        type: 'SUBSCRIPTION_ACTIVATED',
        title: 'Abonnement activé',
        body: `${plan?.name ?? 'Votre abonnement'} est actif jusqu’au ${friendlyDate(
          subscription?.renewAt ?? null,
        )}. Retrouvez vos factures dans votre espace.`,
        link: '/dashboard/abonnement',
      });
    }

    return { activated, alreadyProcessed: false };
  }

  private async expireOutdated(userId: string): Promise<void> {
    const now = new Date();
    await this.prisma.subscription.updateMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        renewAt: { lt: now },
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });
    await this.prisma.subscription.updateMany({
      where: {
        userId,
        status: SubscriptionStatus.CANCELED,
        endsAt: { lt: now },
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  private toSubscriptionView(subscription: {
    id: string;
    plan: SubscriptionPlan;
    interval: BillingInterval;
    status: SubscriptionStatus;
    startsAt: Date | null;
    renewAt: Date | null;
    endsAt: Date | null;
  }): SubscriptionView {
    const plan = findPlan(subscription.plan);
    return {
      id: subscription.id,
      plan: subscription.plan,
      planName: plan?.name ?? subscription.plan,
      interval: subscription.interval,
      intervalLabel: INTERVAL_LABELS[subscription.interval],
      status: subscription.status,
      priceFcfa: plan?.prices[subscription.interval] ?? null,
      startsAt: subscription.startsAt?.toISOString() ?? null,
      renewAt: subscription.renewAt?.toISOString() ?? null,
      endsAt: subscription.endsAt?.toISOString() ?? null,
      cancelAtPeriodEnd:
        subscription.status === SubscriptionStatus.CANCELED &&
        Boolean(subscription.endsAt && subscription.endsAt.getTime() > Date.now()),
    };
  }

  private toPaymentView(payment: {
    id: string;
    invoiceNumber: string | null;
    amountFcfa: number;
    provider: PaymentProvider;
    status: PaymentStatus;
    description: string | null;
    plan: SubscriptionPlan | null;
    interval: BillingInterval | null;
    createdAt: Date;
    paidAt: Date | null;
  }): PaymentView {
    return {
      id: payment.id,
      invoiceNumber: payment.invoiceNumber,
      amountFcfa: payment.amountFcfa,
      provider: payment.provider,
      status: payment.status,
      description: payment.description,
      plan: payment.plan,
      interval: payment.interval,
      createdAt: payment.createdAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
    };
  }
}
