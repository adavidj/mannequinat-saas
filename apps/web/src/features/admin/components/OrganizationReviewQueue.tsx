'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { ORGANIZATION_TYPE_LABELS, formatDateTime } from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  cardClass,
  dangerButtonClass,
  primaryButtonClass,
} from '@/shared/lib/ui';
import type { AdminOrganization, VerificationStatus } from '@/shared/types/api';

export function OrganizationReviewQueue({
  initialOrganizations,
}: {
  initialOrganizations: AdminOrganization[];
}) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function review(
    organization: AdminOrganization,
    verificationStatus: Exclude<VerificationStatus, 'PENDING'>,
  ) {
    if (
      verificationStatus === 'REJECTED' &&
      !window.confirm(`Refuser la vérification de « ${organization.name} » ?`)
    ) {
      return;
    }
    setPendingId(organization.id);
    setError(null);
    setNotice(null);
    try {
      await browserApi(`/admin/organizations/${organization.id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ verificationStatus }),
      });
      setOrganizations((current) => current.filter((item) => item.id !== organization.id));
      setNotice(
        verificationStatus === 'VERIFIED'
          ? `« ${organization.name} » est vérifiée.`
          : `« ${organization.name} » a été refusée.`,
      );
      router.refresh();
    } catch (reviewError) {
      setError(browserApiMessage(reviewError));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className={alertErrorClass} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className={alertSuccessClass}>{notice}</p> : null}

      {organizations.length === 0 ? (
        <p className={cardClass}>Aucune organisation en attente de vérification.</p>
      ) : (
        <ul className="space-y-4">
          {organizations.map((organization) => (
            <li key={organization.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{organization.name}</h2>
                  <p className="text-sm text-slate-600">
                    {ORGANIZATION_TYPE_LABELS[organization.type]} · {organization.owner.email}
                  </p>
                  <p className="text-xs text-slate-500">
                    Déclarée le {formatDateTime(organization.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={primaryButtonClass}
                    onClick={() => void review(organization, 'VERIFIED')}
                    disabled={pendingId === organization.id}
                  >
                    Vérifier
                  </button>
                  <button
                    type="button"
                    className={dangerButtonClass}
                    onClick={() => void review(organization, 'REJECTED')}
                    disabled={pendingId === organization.id}
                  >
                    Refuser
                  </button>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    IFU
                  </dt>
                  <dd className="mt-1 font-mono text-slate-900">
                    {organization.ifu ?? 'Non renseigné'}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    RCCM
                  </dt>
                  <dd className="mt-1 font-mono text-slate-900">
                    {organization.rccm ?? 'Non renseigné'}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-xs text-slate-500">
                La consultation de ces justificatifs est journalisée dans l’audit.
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
