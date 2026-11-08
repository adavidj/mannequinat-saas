import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { InvoicePrintButton } from '@/features/billing/components/InvoicePrintButton';
import { ApiError, apiFetch } from '@/shared/lib/api';
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatFcfa,
} from '@/shared/lib/labels';
import { getSessionUser } from '@/shared/lib/session';
import { badgeClass } from '@/shared/lib/ui';
import type { Invoice } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Facture' };

type InvoicePageProps = {
  params: Promise<{ paymentId: string }>;
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value));
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const user = await getSessionUser();
  if (!user || (user.role !== 'MODELE' && user.role !== 'AGENCE')) {
    redirect('/dashboard');
  }

  const { paymentId } = await params;
  let invoice: Invoice;
  try {
    invoice = await apiFetch<Invoice>(`/billing/payments/${paymentId}/invoice`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/abonnement"
          className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 underline decoration-1 underline-offset-4 transition-colors hover:text-gold-700"
        >
          ← Retour à l’abonnement
        </Link>
        <InvoicePrintButton />
      </div>

      <article className="border border-ink-900/10 bg-white p-7 shadow-soft sm:p-12 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col gap-6 border-b border-ink-900/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-3xl font-medium tracking-sharpest text-ink-950">
              Model<span className="italic text-gold-600">Bénin</span>
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-ink-400">
              {invoice.seller.address}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-400">
              {invoice.seller.contact}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">
              Facture
            </p>
            <p className="mt-2 font-mono text-lg tracking-widest text-ink-950">{invoice.number}</p>
            <span className={`${badgeClass} ${PAYMENT_STATUS_STYLES[invoice.status]} mt-3`}>
              {PAYMENT_STATUS_LABELS[invoice.status]}
            </span>
          </div>
        </header>

        <div className="grid gap-8 border-b border-ink-900/10 py-8 sm:grid-cols-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-400">
              Facturé à
            </p>
            <p className="mt-2 text-sm text-ink-900">{invoice.customer.email}</p>
            <p className="mt-1 text-xs text-ink-500">Compte ModelBénin</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-400">
              Émise le
            </p>
            <p className="mt-2 text-sm text-ink-900">{formatDate(invoice.issuedAt)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-400">
              Payée le
            </p>
            <p className="mt-2 text-sm text-ink-900">{formatDate(invoice.paidAt)}</p>
          </div>
        </div>

        <div className="py-8">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-ink-400">
                <th className="pb-4 font-semibold">Désignation</th>
                <th className="pb-4 text-right font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody className="border-t border-ink-900/10">
              <tr>
                <td className="py-5">
                  <p className="text-sm font-medium text-ink-900">{invoice.description}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {[invoice.planName, invoice.intervalLabel].filter(Boolean).join(' · ') ||
                      'Abonnement ModelBénin'}
                  </p>
                  {invoice.period ? (
                    <p className="mt-1 text-xs text-ink-400">
                      Période : {formatDate(invoice.period.startsAt)} →{' '}
                      {formatDate(invoice.period.renewAt)}
                    </p>
                  ) : null}
                </td>
                <td className="py-5 text-right text-sm text-ink-900">
                  {formatFcfa(invoice.amountFcfa)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-6 border-t border-ink-900/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 text-xs leading-6 text-ink-500">
            <p>
              <span className="text-[9px] uppercase tracking-widest text-ink-400">Prestataire</span>{' '}
              : {PAYMENT_PROVIDER_LABELS[invoice.provider]}
            </p>
            <p>
              <span className="text-[9px] uppercase tracking-widest text-ink-400">Référence</span> :{' '}
              <span className="font-mono text-[11px]">{invoice.providerReference}</span>
            </p>
            <p className="max-w-sm pt-2">
              Document généré automatiquement. Aucune coordonnée de paiement n’est conservée par
              ModelBénin. Pour toute question : {invoice.seller.contact}.
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-400">
              Total ({invoice.currency})
            </p>
            <p className="mt-2 font-display text-4xl font-light leading-none text-ink-950">
              {formatFcfa(invoice.amountFcfa)}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
