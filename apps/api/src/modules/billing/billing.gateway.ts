import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';

import { AppConfigService } from '../../config/app-config.service';

export type GatewayCheckoutInput = {
  paymentId: string;
  reference: string;
  amountFcfa: number;
  description: string;
  customerEmail: string;
  planCode: string;
  interval: string;
};

export type GatewayCheckout = {
  mode: 'simulated' | 'redirect';
  provider: PaymentProvider;
  checkoutUrl: string | null;
  reference: string;
};

export type GatewayEventStatus = 'succeeded' | 'failed' | 'canceled' | 'pending';

/**
 * Passerelle de paiement.
 *
 * En développement, aucune clé n'est nécessaire : le paiement est simulé et
 * confirmé par un endpoint authentifié. En production, FedaPay prend le relais
 * dès que FEDAPAY_SECRET_KEY est présent. La signature des webhooks est
 * vérifiée en HMAC-SHA256 quand FEDAPAY_WEBHOOK_SECRET est configuré.
 */
@Injectable()
export class BillingGateway {
  private readonly logger = new Logger(BillingGateway.name);

  constructor(private readonly config: AppConfigService) {}

  get simulationEnabled(): boolean {
    return this.config.billingSimulationEnabled && this.config.billingProvider === 'SIMULATED';
  }

  async createCheckout(input: GatewayCheckoutInput): Promise<GatewayCheckout> {
    if (this.config.billingProvider === 'FEDAPAY') {
      return this.createFedapayCheckout(input);
    }
    if (!this.simulationEnabled) {
      throw new ServiceUnavailableException(
        'Aucun prestataire de paiement n’est configuré. Contactez l’équipe ModelBénin.',
      );
    }
    this.logger.warn(
      `Paiement simulé pour ${input.reference} (${input.amountFcfa} FCFA). Configurez BILLING_PROVIDER=FEDAPAY pour encaisser réellement.`,
    );
    return {
      mode: 'simulated',
      provider: PaymentProvider.SIMULATED,
      checkoutUrl: null,
      reference: input.reference,
    };
  }

  /** Vérifie la signature d'un webhook. En production, un secret est exigé. */
  verifyWebhook(rawBody: string, signature: string | null): boolean {
    const secret = this.config.fedapayWebhookSecret;
    if (!secret) {
      if (this.config.nodeEnv === 'production') {
        this.logger.error('FEDAPAY_WEBHOOK_SECRET absent : webhook refusé en production.');
        return false;
      }
      this.logger.warn('FEDAPAY_WEBHOOK_SECRET absent : signature non vérifiée en développement.');
      return true;
    }
    if (!signature) {
      return false;
    }
    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    const received = signature
      .trim()
      .replace(/^sha256=/, '')
      .toLowerCase();
    if (received.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
  }

  /** Référence marchande renvoyée par l'agrégateur (FedaPay ou charge simulée). */
  extractReference(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    const body = payload as Record<string, unknown>;
    const entity =
      body.entity && typeof body.entity === 'object'
        ? (body.entity as Record<string, unknown>)
        : {};
    const data =
      body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : {};

    for (const candidate of [
      body.merchant_reference,
      body.merchantReference,
      body.reference,
      entity.merchant_reference,
      entity.merchantReference,
      entity.reference,
      data.merchant_reference,
      data.reference,
    ]) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return null;
  }

  extractStatus(payload: unknown): GatewayEventStatus {
    if (!payload || typeof payload !== 'object') {
      return 'pending';
    }
    const body = payload as Record<string, unknown>;
    const label = String(body.name ?? body.event ?? body.status ?? '').toLowerCase();
    if (/(approved|succeed|success|paid)/.test(label)) {
      return 'succeeded';
    }
    if (/(declin|fail|error)/.test(label)) {
      return 'failed';
    }
    if (/(cancel|refund)/.test(label)) {
      return 'canceled';
    }
    return 'pending';
  }

  private async createFedapayCheckout(input: GatewayCheckoutInput): Promise<GatewayCheckout> {
    const secretKey = this.config.fedapaySecretKey;
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Le paiement Mobile Money n’est pas encore activé. Contactez l’équipe ModelBénin.',
      );
    }

    let response: Response;
    try {
      response = await fetch(`${this.config.fedapayApiUrl}/transactions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${secretKey}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          description: input.description,
          amount: input.amountFcfa,
          currency: { iso: 'XOF' },
          merchant_reference: input.reference,
          callback_url: `${this.config.appPublicUrl}/dashboard/abonnement?paiement=${input.paymentId}`,
          customer: { email: input.customerEmail },
          metadata: { plan: input.planCode, interval: input.interval },
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error: unknown) {
      this.logger.error(
        `FedaPay injoignable pour ${input.reference} : ${
          error instanceof Error ? error.message : 'erreur réseau'
        }`,
      );
      throw new ServiceUnavailableException(
        'Le prestataire de paiement est momentanément injoignable. Réessayez dans un instant.',
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(
        `FedaPay a refusé la transaction ${input.reference} (${response.status}) : ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Le prestataire de paiement a refusé la demande. Réessayez dans un instant.',
      );
    }

    const payload = (await response.json().catch(() => null)) as {
      transaction?: { payment_url?: string; paymentUrl?: string };
    } | null;
    const transaction = payload?.transaction ?? {};
    const checkoutUrl = transaction.payment_url ?? transaction.paymentUrl ?? null;
    if (!checkoutUrl) {
      this.logger.error(`FedaPay n’a pas renvoyé d’URL de paiement pour ${input.reference}.`);
      throw new ServiceUnavailableException(
        'Le prestataire de paiement n’a pas renvoyé de lien. Réessayez dans un instant.',
      );
    }

    return {
      mode: 'redirect',
      provider: PaymentProvider.FEDAPAY,
      checkoutUrl,
      reference: input.reference,
    };
  }
}
