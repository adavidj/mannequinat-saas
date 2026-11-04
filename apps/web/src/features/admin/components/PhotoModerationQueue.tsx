'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { PHOTO_KIND_LABELS, formatDateTime } from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  cardClass,
  dangerButtonClass,
  primaryButtonClass,
} from '@/shared/lib/ui';
import type { AdminPhoto, ModerationStatus } from '@/shared/types/api';

export function PhotoModerationQueue({ initialPhotos }: { initialPhotos: AdminPhoto[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function review(photo: AdminPhoto, status: Exclude<ModerationStatus, 'PENDING'>) {
    if (status === 'REJECTED' && !window.confirm('Refuser cette photo ?')) {
      return;
    }
    setPendingId(photo.id);
    setError(null);
    setNotice(null);
    try {
      await browserApi(`/admin/photos/${photo.id}/moderation`, {
        method: 'PATCH',
        body: JSON.stringify({ moderationStatus: status }),
      });
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setNotice(
        status === 'APPROVED'
          ? `Photo de ${photo.profile.displayName} approuvée.`
          : `Photo de ${photo.profile.displayName} refusée.`,
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

      {photos.length === 0 ? (
        <p className={cardClass}>
          Aucune photo en attente. Les nouvelles photos apparaîtront ici dès leur téléversement.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <article
              key={photo.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <img
                src={photo.signedUrl}
                alt={`Photo ${PHOTO_KIND_LABELS[photo.kind].toLowerCase()}`}
                className="aspect-[3/4] w-full bg-slate-100 object-cover"
                loading="lazy"
              />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {photo.profile.displayName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {photo.profile.city} · {PHOTO_KIND_LABELS[photo.kind]}
                  </p>
                  <p className="text-xs text-slate-500">
                    Envoyée le {formatDateTime(photo.createdAt)}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={primaryButtonClass}
                    onClick={() => void review(photo, 'APPROVED')}
                    disabled={pendingId === photo.id}
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    className={dangerButtonClass}
                    onClick={() => void review(photo, 'REJECTED')}
                    disabled={pendingId === photo.id}
                  >
                    Refuser
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
