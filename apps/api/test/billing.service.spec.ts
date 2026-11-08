import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
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
import { describe, expect, it, vi } from 'vitest';

import { BillingService } from '../src/modules/billing/billing.service';

type SubscriptionState = {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  interval: BillingInterval;
  status: SubscriptionStatus;
  startsAt: Date | null;
  renewAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentState = {
  id: string;
  userId: string;
  subscriptionId: string | null;
  amountFcfa: number;
  provider: PaymentProvider;
  providerReference: string;
  status: PaymentStatus;
  idempotencyKey: string;
  plan: SubscriptionPlan | null;
  interval: BillingInterval | null;
  description: string | null;
  invoiceNumber: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function baseSubscription(overrides: Partial<SubscriptionState> = {}): SubscriptionState {
  return {
    id: 'sub-1',
    userId: 'user-1',
    plan: SubscriptionPlan.MODEL_PREMIUM,
    interval: BillingInterval.MONTHLY,
    status: SubscriptionStatus.PENDING,
    startsAt: null,
    renewAt: null,
    endsAt: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    ...overrides,
  };
}

function basePayment(overrides: Partial<PaymentState> = {}): PaymentState {
  return {
    id: 'payment-1',
    userId: 'user-1',
    subscriptionId: 'sub-1',
    amountFcfa: 2000,
    provider: PaymentProvider.SIMULATED,
    providerReference: 'MBP-reference-1',
    status: PaymentStatus.PENDING,
    idempotencyKey: 'checkout:MBP-reference-1',
    plan: SubscriptionPlan.MODEL_PREMIUM,
    interval: BillingInterval.MONTHLY,
    description: 'Premium Modèle — abonnement mensuel',
    invoiceNumber: 'MB-2026-ABCDEF12',
    paidAt: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createService(options: { user?: Record<string, unknown> } = {}) {
  const user = {
    id: 'user-1',
    email: 'awa@example.bj',
    role: UserRole.MODELE,
    status: 'ACTIVE',
    ...options.user,
  };
  let subscription: SubscriptionState | null = null;
  let payment: PaymentState | null = null;

  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
    },
    subscription: {
      findFirst: vi.fn(async () => subscription),
      findUnique: vi.fn(async () => subscription),
      create: vi.fn(async ({ data }: { data: Partial<SubscriptionState> }) => {
        subscription = baseSubscription({
          userId: String(data.userId),
          plan: data.plan ?? SubscriptionPlan.MODEL_PREMIUM,
          interval: data.interval ?? BillingInterval.MONTHLY,
          status: data.status ?? SubscriptionStatus.PENDING,
        });
        return subscription;
      }),
      update: vi.fn(async ({ data }: { data: Partial<SubscriptionState> }) => {
        subscription = { ...(subscription ?? baseSubscription()), ...data };
        return subscription;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    payment: {
      create: vi.fn(async ({ data }: { data: Partial<PaymentState> }) => {
        payment = basePayment({
          amountFcfa: Number(data.amountFcfa),
          provider: data.provider ?? PaymentProvider.SIMULATED,
          providerReference: String(data.providerReference),
          idempotencyKey: String(data.idempotencyKey),
          plan: data.plan ?? null,
          interval: data.interval ?? null,
          description: data.description ?? null,
          invoiceNumber: data.invoiceNumber ?? null,
          subscriptionId: data.subscriptionId ?? null,
        });
        return payment;
      }),
      findUnique: vi.fn(async () => payment),
      findFirst: vi.fn(async () => payment),
      findMany: vi.fn(async () => (payment ? [payment] : [])),
      count: vi.fn(async () => (payment ? 1 : 0)),
      update: vi.fn(async ({ data }: { data: Partial<PaymentState> }) => {
        payment = { ...(payment ?? basePayment()), ...data };
        return payment;
      }),
      updateMany: vi.fn(async ({ data }: { data: Partial<PaymentState> }) => {
        if (!payment || (data.status && payment.status === PaymentStatus.SUCCEEDED)) {
          return { count: 0 };
        }
        payment = { ...payment, ...data };
        return { count: 1 };
      }),
    },
    $transaction: vi.fn(async (arg: unknown) =>
      Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => Promise<unknown>)(prisma),
    ),
  };

  const config = {
    billingProvider: 'SIMULATED' as const,
    nodeEnv: 'test',
    appPublicUrl: 'https://modelbenin.test',
    fedapaySecretKey: null,
    fedapayWebhookSecret: null,
    fedapayApiUrl: 'https://api.fedapay.test',
  };
  const gateway = {
    simulationEnabled: true,
    createCheckout: vi.fn(async (input: { reference: string }) => ({
      mode: 'simulated' as const,
      provider: PaymentProvider.SIMULATED,
      checkoutUrl: null,
      reference: input.reference,
    })),
    verifyWebhook: vi.fn(() => true),
    extractReference: vi.fn(() => 'MBP-reference-1'),
    extractStatus: vi.fn(() => 'succeeded' as const),
  };
  const notifications = { notify: vi.fn(async () => undefined) };

  return {
    service: new BillingService(
      prisma as never,
      config as never,
      gateway as never,
      notifications as never,
    ),
    prisma,
    gateway,
    notifications,
    getUser: () => user,
    getSubscription: () => subscription,
    setSubscription: (value: SubscriptionState | null) => {
      subscription = value;
    },
    getPayment: () => payment,
    setPayment: (value: PaymentState | null) => {
      payment = value;
    },
  };
}

describe('BillingService', () => {
  it('facture le prix du catalogue, jamais un montant fourni par le client', async () => {
    const { service, prisma } = createService();

    const result = await service.checkout('user-1', {
      plan: SubscriptionPlan.MODEL_PREMIUM,
      interval: BillingInterval.MONTHLY,
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amountFcfa: 2000,
        plan: SubscriptionPlan.MODEL_PREMIUM,
        interval: BillingInterval.MONTHLY,
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.SIMULATED,
      }),
    });
    expect(result.checkout.mode).toBe('simulated');
    expect(result.payment.amountFcfa).toBe(2000);
  });

  it('applique le tarif annuel et le tarif agence', async () => {
    const yearly = createService();
    await yearly.service.checkout('user-1', {
      plan: SubscriptionPlan.MODEL_PREMIUM,
      interval: BillingInterval.YEARLY,
    });
    expect(yearly.prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amountFcfa: 18000 }),
    });

    const agency = createService({
      user: { role: UserRole.AGENCE, email: 'contact@eclat.bj' },
    });
    await agency.service.checkout('user-1', {
      plan: SubscriptionPlan.AGENCY_PRO,
      interval: BillingInterval.MONTHLY,
    });
    expect(agency.prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amountFcfa: 40000 }),
    });
  });

  it('refuse une formule d’un autre espace et les comptes non facturables', async () => {
    const { service } = createService();

    await expect(
      service.checkout('user-1', {
        plan: SubscriptionPlan.AGENCY_PRO,
        interval: BillingInterval.MONTHLY,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const formateur = createService({ user: { role: UserRole.FORMATEUR } });
    await expect(
      formateur.service.checkout('user-1', {
        plan: SubscriptionPlan.MODEL_PREMIUM,
        interval: BillingInterval.MONTHLY,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse une formule non proposée au rythme annuel', async () => {
    const agency = createService({ user: { role: UserRole.AGENCE } });

    await expect(
      agency.service.checkout('user-1', {
        plan: SubscriptionPlan.AGENCY_STARTER,
        interval: BillingInterval.YEARLY,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('active l’abonnement à la confirmation simulée, puis reste idempotent', async () => {
    const { service, prisma, notifications, getSubscription, getPayment } = createService();
    await service.checkout('user-1', {
      plan: SubscriptionPlan.MODEL_PREMIUM,
      interval: BillingInterval.MONTHLY,
    });
    const paymentId = getPayment()?.id ?? 'payment-1';

    const first = await service.confirmSimulatedPayment('user-1', paymentId);

    expect(first).toEqual({ status: PaymentStatus.SUCCEEDED, activated: true });
    expect(getPayment()?.status).toBe(PaymentStatus.SUCCEEDED);
    const renewAt = getSubscription()?.renewAt;
    expect(renewAt).toBeInstanceOf(Date);
    expect(getSubscription()?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SUBSCRIPTION_ACTIVATED' }),
    );
    const updateCalls = prisma.subscription.update.mock.calls.length;

    const second = await service.confirmSimulatedPayment('user-1', paymentId);

    expect(second).toEqual({ status: PaymentStatus.SUCCEEDED, activated: false });
    expect(prisma.subscription.update.mock.calls.length).toBe(updateCalls);
    expect(getSubscription()?.renewAt).toEqual(renewAt);
  });

  it('refuse la confirmation simulée quand un autre prestataire est actif', async () => {
    const { service, setPayment } = createService();
    setPayment(basePayment({ provider: PaymentProvider.FEDAPAY }));

    await expect(service.confirmSimulatedPayment('user-1', 'payment-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('résilie en fin de période payée et annule les paiements en attente', async () => {
    const { service, prisma, notifications, setSubscription } = createService();
    const renewAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    setSubscription(
      baseSubscription({
        status: SubscriptionStatus.ACTIVE,
        startsAt: new Date('2026-10-01T00:00:00.000Z'),
        renewAt,
      }),
    );

    const overview = await service.cancel('user-1');

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { status: SubscriptionStatus.CANCELED, endsAt: renewAt },
    });
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: { subscriptionId: 'sub-1', status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.CANCELED },
    });
    expect(overview.subscription?.cancelAtPeriodEnd).toBe(true);
    expect(overview.subscription?.endsAt).toBe(renewAt.toISOString());
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SUBSCRIPTION_CANCELED' }),
    );
  });

  it('refuse de résilier un abonnement déjà terminé', async () => {
    const { service } = createService();

    await expect(service.cancel('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejette un webhook sans signature valide', async () => {
    const { service, gateway } = createService();
    gateway.verifyWebhook.mockReturnValue(false);

    await expect(service.handleWebhook('fedapay', '{}', 'sha256=bad', {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('active un paiement FedaPay confirmé par webhook', async () => {
    const { service, gateway, setPayment, setSubscription, getPayment, getSubscription } =
      createService();
    gateway.extractReference.mockReturnValue('MBP-reference-1');
    setPayment(basePayment({ provider: PaymentProvider.FEDAPAY }));
    setSubscription(baseSubscription());

    const result = await service.handleWebhook('fedapay', '{}', 'sha256=ok', {
      name: 'transaction.approved',
    });

    expect(result).toEqual({ ok: true, processed: true });
    expect(getPayment()?.status).toBe(PaymentStatus.SUCCEEDED);
    expect(getSubscription()?.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('ignore un webhook dont la référence est inconnue', async () => {
    const { service, setPayment } = createService();
    setPayment(null);

    const result = await service.handleWebhook('fedapay', '{}', 'sha256=ok', {
      name: 'transaction.approved',
    });

    expect(result).toEqual({ ok: true, processed: false, reason: 'paiement inconnu' });
  });

  it('limite la facture au propriétaire du paiement', async () => {
    const { service, prisma, setPayment } = createService();
    setPayment(basePayment({ status: PaymentStatus.SUCCEEDED, paidAt: new Date() }));
    prisma.payment.findFirst.mockResolvedValueOnce({
      ...basePayment({ status: PaymentStatus.SUCCEEDED, paidAt: new Date() }),
      user: { email: 'awa@example.bj' },
      subscription: {
        startsAt: new Date('2026-11-01T00:00:00.000Z'),
        renewAt: new Date('2026-12-01T00:00:00.000Z'),
      },
    });

    const invoice = await service.invoice('user-1', 'payment-1');

    expect(prisma.payment.findFirst).toHaveBeenCalledWith({
      where: { id: 'payment-1', userId: 'user-1' },
      include: {
        subscription: { select: { startsAt: true, renewAt: true } },
        user: { select: { email: true } },
      },
    });
    expect(invoice.number).toBe('MB-2026-ABCDEF12');
    expect(invoice.customer.email).toBe('awa@example.bj');
    expect(invoice.seller.contact).toBe('facturation@modelbenin.bj');

    prisma.payment.findFirst.mockResolvedValueOnce(null);
    await expect(service.invoice('user-2', 'payment-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('présente le catalogue correspondant au rôle, puis expire les périodes passées', async () => {
    const { service, prisma } = createService();

    const overview = await service.overview('user-1', { take: 50 });

    expect(overview.plans.map((plan) => plan.code)).toEqual([SubscriptionPlan.MODEL_PREMIUM]);
    expect(overview.simulation).toBe(true);
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        status: SubscriptionStatus.ACTIVE,
        renewAt: { lt: expect.any(Date) },
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  });
});
