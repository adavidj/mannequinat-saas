import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SubscriptionManager } from '@/features/billing/components/SubscriptionManager';
import { apiFetch } from '@/shared/lib/api';
import { getSessionUser } from '@/shared/lib/session';
import type { BillingOverview } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Mon abonnement' };

type SubscriptionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const user = await getSessionUser();
  if (!user || (user.role !== 'MODELE' && user.role !== 'AGENCE')) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const rawPayment = params.paiement;
  const returnedPaymentId = Array.isArray(rawPayment) ? rawPayment[0] : (rawPayment ?? null);

  const overview = await apiFetch<BillingOverview>('/billing/overview?take=50');

  return <SubscriptionManager initial={overview} returnedPaymentId={returnedPaymentId} />;
}
