'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  ArrowRightIcon,
  CheckIcon,
  CreditCardIcon,
  ReceiptIcon,
  ShieldIcon,
  SparkIcon,
} from '@/shared/components/icons';
import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import {
  BILLING_INTERVAL_LABELS,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_STYLES,
  formatFcfa,
} from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertInfoClass,
  alertSuccessClass,
  badgeClass,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type {
  BillingCheckoutResult,
  BillingOverview,
  BillingPayment,
  PaymentStatus,
  SubscriptionView,
} from '@/shared/types/api';

type FeedbackType = 'success' | 'error' | 'info';
type Feedback = { type: FeedbackType; message: string } | null;

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value));
}

function statusDetail(subscription: SubscriptionView): string {
  if (subscription.cancelAtPeriodEnd) {
    return `Votre formule reste active jusqu’au ${formatDate(subscription.endsAt)}.`;
  }
  if (subscription.status === 'ACTIVE') {
    return `Renouvellement prévu le ${formatDate(subscription.renewAt)}.`;
  }
  if (subscription.status === 'PENDING') {
    return 'En attente de la confirmation du paiement.';
  }
  if (subscription.status === 'PAST_DUE') {
    return `Paiement en retard. Régularisez avant le ${formatDate(subscription.endsAt)}.`;
  }
  return 'Cette formule n’est plus active.';
}

export function SubscriptionManager({
  initial,
  returnedPaymentId,
}: {
  initial: BillingOverview;
  returnedPaymentId?: string | null;
}) {
  const [overview, setOverview] = useState<BillingOverview>(initial);
  const [selectedPlan, setSelectedPlan] = useState<string>(
    initial.subscription?.plan ?? initial.plans[0]?.code ?? '',
  );
  const [selectedInterval, setSelectedInterval] = useState<'MONTHLY' | 'YEARLY'>(
    initial.subscription?.interval ?? 'MONTHLY',
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(
    returnedPaymentId
      ? {
          type: 'info',
          message:
            'Paiement transmis au prestataire. La confirmation peut prendre quelques instants : actualisez la page si votre formule n’apparaît pas encore.',
        }
      : null,
  );
  const [pending, setPending] = useState<BillingCheckoutResult | null>(null);

  const plans = overview.plans;
  const subscription = overview.subscription;
  const billingDisabled = overview.mode === 'disabled';
  const currentPlan = plans.find((plan) => plan.code === selectedPlan) ?? plans[0];
  const currentPrice = currentPlan?.prices[selectedInterval] ?? null;
  const yearlyAvailable = plans.some((plan) => plan.prices.YEARLY !== null);
  const renewingSamePlan = Boolean(
    subscription &&
    subscription.plan === currentPlan?.code &&
    subscription.interval === selectedInterval,
  );

  async function refresh() {
    const next = await browserApi<BillingOverview>('/billing/overview?take=50');
    setOverview(next);
    if (!next.plans.some((plan) => plan.code === selectedPlan) && next.plans[0]) {
      setSelectedPlan(next.plans[0].code);
    }
    return next;
  }

  async function refreshWithFeedback(message: string, type: FeedbackType = 'success') {
    setBusy('refresh');
    try {
      await refresh();
      setFeedback({ type, message });
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function startCheckout() {
    if (!currentPlan || currentPrice === null) return;
    setBusy('checkout');
    setFeedback(null);
    try {
      const result = await browserApi<BillingCheckoutResult>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: currentPlan.code, interval: selectedInterval }),
      });

      if (result.checkout.mode === 'redirect' && result.checkout.checkoutUrl) {
        window.location.assign(result.checkout.checkoutUrl);
        return;
      }

      setPending(result);
      setFeedback({
        type: 'info',
        message: `Paiement préparé pour ${currentPlan.name}. Confirmez-le ci-dessous pour activer la formule.`,
      });
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  async function confirmPending() {
    if (!pending) return;
    setBusy('confirm');
    setFeedback(null);
    try {
      const result = await browserApi<{ status: PaymentStatus; activated: boolean }>(
        `/billing/payments/${pending.payment.id}/confirm`,
        { method: 'POST' },
      );
      setPending(null);
      await refreshWithFeedback(
        result.activated
          ? 'Paiement confirmé : votre abonnement est actif.'
          : 'Paiement confirmé. Votre abonnement a été mis à jour.',
      );
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
      setBusy(null);
    }
  }

  async function cancelSubscription() {
    if (!subscription) return;
    if (
      !window.confirm(
        'Résilier votre abonnement ? Votre formule reste active jusqu’à la fin de la période déjà payée, puis votre profil repasse en formule gratuite.',
      )
    ) {
      return;
    }
    setBusy('cancel');
    setFeedback(null);
    try {
      const next = await browserApi<BillingOverview>('/billing/subscription/cancel', {
        method: 'POST',
      });
      setOverview(next);
      setPending(null);
      setFeedback({
        type: 'success',
        message: next.subscription?.cancelAtPeriodEnd
          ? `Abonnement résilié. Il reste actif jusqu’au ${formatDate(next.subscription.endsAt)}.`
          : 'Abonnement résilié. Votre profil repasse en formule gratuite.',
      });
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">
            Facturation · Saison 01
          </p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-ink-950 sm:text-5xl">
            Mon abonnement
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">
            Gérez votre formule et retrouvez chaque facture. Sans engagement : la résiliation prend
            effet à la fin de la période déjà payée.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshWithFeedback('Situation mise à jour.', 'info')}
          disabled={busy !== null}
          className={secondaryButtonClass}
        >
          {busy === 'refresh' ? 'Actualisation…' : 'Actualiser'}
        </button>
      </header>

      {billingDisabled ? (
        <p className={alertInfoClass} role="status">
          <strong>Paiements fermés.</strong> Aucun abonnement ne peut être souscrit pour le moment.
          Les formules sont présentées à titre informatif ; le paiement sera ouvert après validation
          des avantages inclus.
        </p>
      ) : null}

      {overview.simulation ? (
        <p className={alertInfoClass} role="status">
          <strong>Mode démonstration.</strong> Aucun montant réel n’est prélevé. Les paiements sont
          simulés localement jusqu’à l’activation du prestataire Mobile Money. Prestataire actif :{' '}
          {PAYMENT_PROVIDER_LABELS[overview.provider === 'FEDAPAY' ? 'FEDAPAY' : 'SIMULATED']}.
        </p>
      ) : null}

      {feedback ? (
        <p
          className={
            feedback.type === 'success'
              ? alertSuccessClass
              : feedback.type === 'error'
                ? alertErrorClass
                : alertInfoClass
          }
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}

      {subscription ? (
        <section className="relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-ivory-50 shadow-lift sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-700/20 blur-[90px]"
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">
                  Formule actuelle
                </p>
                <span
                  className={`${badgeClass} ${SUBSCRIPTION_STATUS_STYLES[subscription.status]}`}
                >
                  {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                </span>
              </div>
              <h2 className="mt-4 font-display text-4xl font-light tracking-tight sm:text-5xl">
                {subscription.planName}
              </h2>
              <p className="mt-3 text-sm text-ivory-100/55">{statusDetail(subscription)}</p>
              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-[11px] uppercase tracking-widest text-ivory-100/40">
                <div>
                  <dt>Rythme</dt>
                  <dd className="mt-1 text-ivory-100/80">
                    {BILLING_INTERVAL_LABELS[subscription.interval]}
                  </dd>
                </div>
                <div>
                  <dt>Depuis</dt>
                  <dd className="mt-1 text-ivory-100/80">{formatDate(subscription.startsAt)}</dd>
                </div>
                <div>
                  <dt>{subscription.cancelAtPeriodEnd ? 'Fin de période' : 'Prochain paiement'}</dt>
                  <dd className="mt-1 text-ivory-100/80">
                    {formatDate(
                      subscription.cancelAtPeriodEnd ? subscription.endsAt : subscription.renewAt,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-4 lg:items-end">
              <p className="font-display text-4xl font-light leading-none">
                {formatFcfa(subscription.priceFcfa)}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-ivory-100/40">
                par {subscription.interval === 'YEARLY' ? 'an' : 'mois'}
              </p>
              {subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE' ? (
                <button
                  type="button"
                  onClick={() => void cancelSubscription()}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-ivory-100 transition-colors hover:border-red-300/60 hover:text-red-200 disabled:opacity-50"
                >
                  Résilier l’abonnement
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <p className={alertInfoClass}>
          Vous n’avez pas encore d’abonnement. Votre profil gratuit reste entièrement
          fonctionnel&nbsp;: choisissez une formule ci-dessous si vous souhaitez aller plus loin.
        </p>
      )}

      {pending ? (
        <section className="rounded-2xl border border-gold-500/40 bg-gold-100/60 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">
                Paiement simulé en attente
              </p>
              <p className="mt-2 font-display text-2xl font-light text-ink-950">
                {pending.payment.description ?? 'Abonnement ModelBénin'} —{' '}
                {formatFcfa(pending.payment.amountFcfa)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-500">
                Référence {pending.checkout.reference}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void confirmPending()}
                disabled={busy !== null}
                className={primaryButtonClass}
              >
                {busy === 'confirm' ? 'Confirmation…' : 'Confirmer le paiement'}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy !== null}
                className={secondaryButtonClass}
              >
                Abandonner
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className={cardClass}>
        <div className="flex flex-col gap-6 border-b border-ink-900/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">
              {subscription ? 'Changer de formule' : 'Choisir une formule'}
            </p>
            <h2 className="mt-2 font-display text-2xl font-light tracking-tight text-ink-950">
              {plans.length > 1
                ? 'Deux niveaux, un seul engagement.'
                : 'Un niveau, sans engagement.'}
            </h2>
          </div>
          {yearlyAvailable ? (
            <div
              className="inline-flex rounded-full border border-ink-900/15 bg-ivory-50 p-1"
              role="group"
              aria-label="Rythme de paiement"
            >
              {(['MONTHLY', 'YEARLY'] as const).map((interval) => (
                <button
                  key={interval}
                  type="button"
                  aria-pressed={selectedInterval === interval}
                  onClick={() => setSelectedInterval(interval)}
                  className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                    selectedInterval === interval
                      ? 'bg-ink-950 text-ivory-50'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {BILLING_INTERVAL_LABELS[interval]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const active = selectedPlan === plan.code;
            const price = plan.prices[selectedInterval];
            return (
              <button
                key={plan.code}
                type="button"
                onClick={() => setSelectedPlan(plan.code)}
                aria-pressed={active}
                disabled={price === null}
                className={`group relative flex flex-col items-start gap-4 rounded-xl border p-5 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45 ${
                  active
                    ? 'border-gold-500 bg-gold-100/40 shadow-soft'
                    : 'border-ink-900/10 bg-ivory-50 hover:border-gold-500/50'
                }`}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-gold-700">
                      {plan.audience === 'MODELE' ? 'Modèle' : 'Agence'}
                    </p>
                    <p className="mt-2 font-display text-2xl font-light tracking-tight text-ink-950">
                      {plan.name}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                      active
                        ? 'border-gold-600 bg-gold-600 text-white'
                        : 'border-ink-900/20 text-transparent'
                    }`}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="text-sm leading-6 text-ink-500">{plan.tagline}</p>
                <p className="font-display text-2xl font-light text-ink-950">
                  {price === null ? 'Non proposé' : formatFcfa(price)}
                  {price !== null ? (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-ink-400">
                      / {selectedInterval === 'YEARLY' ? 'an' : 'mois'}
                    </span>
                  ) : null}
                </p>
                {plan.highlight ? (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-gold-700">
                    <SparkIcon className="h-3 w-3" /> Recommandé
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-ink-900/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-6 text-ink-500">
            {renewingSamePlan
              ? 'Le renouvellement prolonge la période déjà payée de 30 jours (ou 365 jours en annuel) après confirmation du paiement.'
              : subscription
                ? 'Un changement de formule prend effet immédiatement après confirmation du paiement. La période déjà payée est prolongée, jamais perdue.'
                : 'Le prix facturé est recalculé côté serveur. Vous pouvez résilier à tout moment, sans frais.'}
          </p>
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={busy !== null || billingDisabled || !currentPlan || currentPrice === null}
            className={primaryButtonClass}
          >
            <CreditCardIcon className="h-4 w-4" />
            {billingDisabled
              ? 'Paiements fermés'
              : busy === 'checkout'
                ? 'Préparation…'
                : renewingSamePlan
                  ? 'Renouveler'
                  : subscription
                    ? 'Changer de formule'
                    : 'Souscrire'}
          </button>
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex flex-col gap-3 border-b border-ink-900/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">
              Historique
            </p>
            <h2 className="mt-2 font-display text-2xl font-light tracking-tight text-ink-950">
              Paiements et factures
            </h2>
          </div>
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-400">
            <ShieldIcon className="h-3.5 w-3.5" />
            {overview.totalPayments} paiement{overview.totalPayments > 1 ? 's' : ''} enregistré
            {overview.totalPayments > 1 ? 's' : ''}
          </p>
        </div>

        {overview.payments.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-ink-900/15 bg-ivory-50 px-5 py-10 text-center">
            <ReceiptIcon className="mx-auto h-6 w-6 text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">
              Aucun paiement pour l’instant. Votre historique apparaîtra ici dès la première
              souscription.
            </p>
          </div>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-ink-400">
                  <th className="py-4 pr-4 font-semibold">Date</th>
                  <th className="py-4 pr-4 font-semibold">Objet</th>
                  <th className="py-4 pr-4 font-semibold">Montant</th>
                  <th className="py-4 pr-4 font-semibold">Statut</th>
                  <th className="py-4 text-right font-semibold">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/[0.07]">
                {overview.payments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PaymentRow({ payment }: { payment: BillingPayment }) {
  return (
    <tr className="align-middle">
      <td className="py-4 pr-4 text-xs text-ink-500">{formatDate(payment.createdAt)}</td>
      <td className="py-4 pr-4">
        <p className="text-sm font-medium text-ink-900">
          {payment.description ?? 'Abonnement ModelBénin'}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
          {payment.invoiceNumber ?? payment.id.slice(-8).toUpperCase()}
        </p>
      </td>
      <td className="py-4 pr-4 text-sm text-ink-900">{formatFcfa(payment.amountFcfa)}</td>
      <td className="py-4 pr-4">
        <span className={`${badgeClass} ${PAYMENT_STATUS_STYLES[payment.status]}`}>
          {PAYMENT_STATUS_LABELS[payment.status]}
        </span>
      </td>
      <td className="py-4 text-right">
        <Link
          href={`/dashboard/abonnement/factures/${payment.id}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-600 underline decoration-1 underline-offset-4 transition-colors hover:text-gold-700"
        >
          Ouvrir
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}
