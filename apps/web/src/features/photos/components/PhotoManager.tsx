'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import {
  MODERATION_LABELS,
  MODERATION_STYLES,
  formatBytes,
  formatDateTime,
} from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  badgeClass,
  dangerButtonClass,
  hintTextClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { OwnedPhoto, OwnedPhotoWithUrl, PhotoKind } from '@/shared/types/api';

type GuidedSlot = {
  kind: Exclude<PhotoKind, 'PORTFOLIO'>;
  title: string;
  instruction: string;
};

const GUIDED_SLOTS: GuidedSlot[] = [
  {
    kind: 'PORTRAIT',
    title: 'Portrait',
    instruction: 'Visage de face, regard vers l’objectif, lumière naturelle, sans filtre.',
  },
  {
    kind: 'FULL_BODY_FRONT',
    title: 'Plein pied — face',
    instruction: 'Corps entier de face, bras le long du corps, fond neutre.',
  },
  {
    kind: 'FULL_BODY_PROFILE',
    title: 'Plein pied — profil',
    instruction: 'Corps entier de profil, posture naturelle, sans accessoire masquant.',
  },
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type PhotoManagerProps = {
  photos: OwnedPhotoWithUrl[];
};

export function PhotoManager({ photos }: PhotoManagerProps) {
  const router = useRouter();
  const [pendingKind, setPendingKind] = useState<PhotoKind | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const latest = (kind: PhotoKind): OwnedPhotoWithUrl | undefined =>
    photos.find((photo) => photo.kind === kind);

  const approvedCount = GUIDED_SLOTS.filter(
    (slot) => latest(slot.kind)?.moderationStatus === 'APPROVED',
  ).length;

  async function upload(kind: PhotoKind, file: File) {
    setError(null);
    setSuccess(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('La photo dépasse 5 Mo. Compressez-la avant de réessayer.');
      return;
    }

    setPendingKind(kind);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      // Consentement explicite : la photo suit la visibilité du profil.
      form.append('visibilityConsent', 'true');

      await browserApi<OwnedPhoto>('/profiles/me/photos', { method: 'POST', body: form });
      setSuccess('Photo envoyée. Elle sera visible après modération.');
      router.refresh();
    } catch (uploadError) {
      setError(browserApiMessage(uploadError));
    } finally {
      setPendingKind(null);
    }
  }

  async function remove(photoId: string) {
    if (!window.confirm('Supprimer définitivement cette photo ?')) {
      return;
    }
    setError(null);
    setSuccess(null);
    setDeletingId(photoId);
    try {
      await browserApi<void>(`/profiles/me/photos/${photoId}`, { method: 'DELETE' });
      setSuccess('Photo supprimée.');
      router.refresh();
    } catch (deleteError) {
      setError(browserApiMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  }

  const portfolio = photos.filter((photo) => photo.kind === 'PORTFOLIO');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes photos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Les trois photos guidées sont obligatoires pour être visible par les agences vérifiées.
          Lumière naturelle, sans retouche, sans filtre. Chaque photo est vérifiée par notre équipe
          avant publication.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
        Photos guidées approuvées :{' '}
        <span className="font-semibold text-slate-900">{approvedCount} / 3</span>
        {approvedCount === 3 ? (
          <span className="ml-2 text-emerald-700">
            Vous pouvez activer la visibilité « agences vérifiées » depuis votre profil.
          </span>
        ) : null}
      </div>

      {error ? (
        <p className={alertErrorClass} role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className={alertSuccessClass}>{success}</p> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {GUIDED_SLOTS.map((slot) => (
          <GuidedPhotoCard
            key={slot.kind}
            slot={slot}
            photo={latest(slot.kind)}
            pending={pendingKind === slot.kind}
            deleting={Boolean(latest(slot.kind) && deletingId === latest(slot.kind)?.id)}
            onUpload={(file) => void upload(slot.kind, file)}
            onDelete={(photoId) => void remove(photoId)}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Portfolio complémentaire
            </h2>
            <p className={hintTextClass}>
              Optionnel : ajoutez des photos de vos travaux. Elles suivent la même modération.
            </p>
          </div>
          <label className={`${secondaryButtonClass} cursor-pointer`}>
            {pendingKind === 'PORTFOLIO' ? 'Envoi…' : 'Ajouter une photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={pendingKind !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) {
                  void upload('PORTFOLIO', file);
                }
              }}
            />
          </label>
        </div>

        {portfolio.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aucune photo de portfolio pour le moment.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {portfolio.map((photo) => (
              <li
                key={photo.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={photo.signedUrl}
                  alt="Photo de portfolio"
                  className="aspect-[3/4] w-full object-cover"
                  loading="lazy"
                />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <StatusBadge status={photo.moderationStatus} />
                  <button
                    type="button"
                    className={dangerButtonClass}
                    disabled={deletingId === photo.id}
                    onClick={() => void remove(photo.id)}
                  >
                    {deletingId === photo.id ? 'Suppression…' : 'Supprimer'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GuidedPhotoCard({
  slot,
  photo,
  pending,
  deleting,
  onUpload,
  onDelete,
}: {
  slot: GuidedSlot;
  photo: OwnedPhotoWithUrl | undefined;
  pending: boolean;
  deleting: boolean;
  onUpload: (file: File) => void;
  onDelete: (photoId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[3/4] bg-slate-100">
        {photo ? (
          <img
            src={photo.signedUrl}
            alt={`Photo ${slot.title.toLowerCase()}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-slate-400 shadow-sm">
              +
            </span>
            <p className="text-sm font-medium text-slate-600">Photo manquante</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{slot.title}</h2>
          {photo ? <StatusBadge status={photo.moderationStatus} /> : null}
        </div>
        <p className="text-xs leading-5 text-slate-600">{slot.instruction}</p>

        {photo ? (
          <p className="text-[11px] text-slate-500">
            {formatDateTime(photo.createdAt)} · {formatBytes(photo.sizeBytes)}
            {photo.width && photo.height ? ` · ${photo.width}×${photo.height}` : ''}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                onUpload(file);
              }
            }}
          />
          <button
            type="button"
            className={primaryButtonClass}
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? 'Envoi…' : photo ? 'Remplacer' : 'Choisir une photo'}
          </button>
          {photo ? (
            <button
              type="button"
              className={dangerButtonClass}
              disabled={deleting}
              onClick={() => onDelete(photo.id)}
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          ) : null}
        </div>

        {photo?.moderationStatus === 'REJECTED' ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            Photo refusée. Remplacez-la en respectant la consigne.
          </p>
        ) : null}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: OwnedPhotoWithUrl['moderationStatus'] }) {
  return (
    <span className={`${badgeClass} ${MODERATION_STYLES[status]} whitespace-nowrap`}>
      {MODERATION_LABELS[status]}
    </span>
  );
}
