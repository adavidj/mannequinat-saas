import type { Metadata } from 'next';

import { OrganizationReviewQueue } from '@/features/admin/components/OrganizationReviewQueue';
import { apiFetch } from '@/shared/lib/api';
import type { AdminOrganization, Paginated } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Vérification des organisations' };

export default async function AdminOrganizationsPage() {
  const organizations = await apiFetch<Paginated<AdminOrganization>>(
    '/admin/organizations?verificationStatus=PENDING&take=50',
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Vérification des organisations
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Contrôlez la cohérence du nom avec le numéro IFU ou RCCM déclaré. Une organisation
          vérifiée accède à la découverte et à la messagerie.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {organizations.total} organisation{organizations.total > 1 ? 's' : ''} en attente.
        </p>
      </header>

      <OrganizationReviewQueue initialOrganizations={organizations.items} />
    </div>
  );
}
