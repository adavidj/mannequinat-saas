'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { formatDate, formatDateTime } from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  badgeClass,
  cardClass,
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { AdminExperience } from '@/shared/types/api';

export function ExperienceReviewQueue({
  initialExperiences,
}: {
  initialExperiences: AdminExperience[];
}) {
  const router = useRouter();
  const [experiences, setExperiences] = useState(initialExperiences);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function review(experience: AdminExperience, verified: boolean) {
    if (
      !verified &&
      !window.confirm(`Marquer l’expérience « ${experience.title} » comme non vérifiée ?`)
    ) {
      return;
    }
    setPendingId(experience.id);
    setError(null);
    setNotice(null);
    try {
      await browserApi(`/admin/experiences/${experience.id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ verified }),
      });
      setExperiences((current) => current.filter((item) => item.id !== experience.id));
      setNotice(
        verified
          ? `« ${experience.title} » est vérifiée : le profil passe en confirmé.`
          : `« ${experience.title} » reste non vérifiée.`,
      );
      router.refresh();
    } catch (reviewError) {
      setError(browserApiMessage(reviewError));
    } finally {
      setPendingId(null);
    }
  }

  async function viewProof(experience: AdminExperience) {
    const tab = window.open('', '_blank');
    if (tab) {
      tab.opener = null;
    }
    setError(null);
    try {
      const { url } = await browserApi<{ url: string }>(
        `/admin/experiences/${experience.id}/proof/url`,
      );
      if (tab) {
        tab.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (proofError) {
      tab?.close();
      setError(browserApiMessage(proofError));
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

      {experiences.length === 0 ? (
        <p className={cardClass}>
          Aucune expérience en attente. Les nouvelles déclarations apparaîtront ici.
        </p>
      ) : (
        <ul className="space-y-4">
          {experiences.map((experience) => (
            <li key={experience.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">{experience.title}</h2>
                    <span className={`${badgeClass} bg-amber-50 text-amber-800 ring-amber-200`}>
                      À vérifier
                    </span>
                    {experience.hasProof ? (
                      <span className={`${badgeClass} bg-slate-100 text-slate-700 ring-slate-200`}>
                        Justificatif joint
                      </span>
                    ) : (
                      <span className={`${badgeClass} bg-red-50 text-red-700 ring-red-200`}>
                        Sans justificatif
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{experience.org}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(experience.startDate)} —{' '}
                    {experience.endDate ? formatDate(experience.endDate) : 'en cours'} · déclarée le{' '}
                    {formatDateTime(experience.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={primaryButtonClass}
                    onClick={() => void review(experience, true)}
                    disabled={pendingId === experience.id}
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    className={dangerButtonClass}
                    onClick={() => void review(experience, false)}
                    disabled={pendingId === experience.id}
                  >
                    Refuser
                  </button>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {experience.profile.displayName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {experience.profile.city} · {experience.profile.user.email}
                    </p>
                  </div>
                  {experience.hasProof ? (
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => void viewProof(experience)}
                    >
                      Ouvrir le justificatif
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Aucun justificatif : vérifiez l’expérience par un autre moyen.
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  La consultation du justificatif est journalisée dans l’audit.
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
