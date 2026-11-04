'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  EMPTY_EXPERIENCE_FORM,
  experienceFormSchema,
  experienceToFormValues,
  experienceToPayload,
  type ExperienceFormValues,
} from '@/features/experiences/schemas';
import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { formatDate, formatDateTime } from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  badgeClass,
  cardClass,
  dangerButtonClass,
  errorTextClass,
  hintTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { OwnedExperience } from '@/shared/types/api';

const MAX_PROOF_BYTES = 10 * 1024 * 1024;

type Feedback = { type: 'success' | 'error'; message: string } | null;

export function ExperienceManager({ experiences }: { experiences: OwnedExperience[] }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: EMPTY_EXPERIENCE_FORM,
  });

  const onCreate = handleSubmit(async (values) => {
    setFeedback(null);
    try {
      await browserApi<OwnedExperience>('/profiles/me/experiences', {
        method: 'POST',
        body: JSON.stringify(experienceToPayload(values)),
      });
      reset(EMPTY_EXPERIENCE_FORM);
      setFeedback({
        type: 'success',
        message:
          'Expérience ajoutée. Ajoutez un justificatif puis attendez la vérification de notre équipe.',
      });
      router.refresh();
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    }
  });

  async function remove(experience: OwnedExperience) {
    if (!window.confirm(`Supprimer « ${experience.title} » ?`)) {
      return;
    }
    setDeletingId(experience.id);
    setFeedback(null);
    try {
      await browserApi<void>(`/profiles/me/experiences/${experience.id}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: 'Expérience supprimée.' });
      router.refresh();
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes expériences</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Défilés, shootings, campagnes : chaque expérience vérifiée par notre équipe renforce votre
          crédibilité. Une seule expérience vérifiée suffit à faire passer votre profil en «
          confirmé ».
        </p>
      </header>

      {feedback ? (
        <p
          className={feedback.type === 'success' ? alertSuccessClass : alertErrorClass}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Expériences déclarées</h2>
        {experiences.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Aucune expérience pour le moment. Ajoutez votre première expérience ci-dessous.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {experiences.map((experience) => (
              <li key={experience.id} className="rounded-xl border border-slate-200 px-4 py-3">
                {editingId === experience.id ? (
                  <ExperienceEditForm
                    experience={experience}
                    onCancel={() => setEditingId(null)}
                    onSaved={(message) => {
                      setEditingId(null);
                      setFeedback({ type: 'success', message });
                      router.refresh();
                    }}
                    onError={(message) => setFeedback({ type: 'error', message })}
                  />
                ) : (
                  <ExperienceRow
                    experience={experience}
                    deleting={deletingId === experience.id}
                    onEdit={() => setEditingId(experience.id)}
                    onDelete={() => void remove(experience)}
                    onFeedback={setFeedback}
                    onRefresh={() => router.refresh()}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Ajouter une expérience</h2>
        <p className={hintTextClass}>
          Une expérience modifiée repasse automatiquement en attente de vérification.
        </p>

        <form className="mt-4 space-y-4" onSubmit={onCreate} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="title">
                Intitulé
              </label>
              <input
                id="title"
                className={inputClass}
                placeholder="Défilé de mode"
                aria-invalid={Boolean(errors.title)}
                {...register('title')}
              />
              {errors.title ? <p className={errorTextClass}>{errors.title.message}</p> : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="org">
                Organisation
              </label>
              <input
                id="org"
                className={inputClass}
                placeholder="Agence ou marque"
                aria-invalid={Boolean(errors.org)}
                {...register('org')}
              />
              {errors.org ? <p className={errorTextClass}>{errors.org.message}</p> : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="startDate">
                Date de début
              </label>
              <input
                id="startDate"
                type="date"
                className={inputClass}
                aria-invalid={Boolean(errors.startDate)}
                {...register('startDate')}
              />
              {errors.startDate ? (
                <p className={errorTextClass}>{errors.startDate.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="endDate">
                Date de fin (facultatif)
              </label>
              <input
                id="endDate"
                type="date"
                className={inputClass}
                aria-invalid={Boolean(errors.endDate)}
                {...register('endDate')}
              />
              {errors.endDate ? <p className={errorTextClass}>{errors.endDate.message}</p> : null}
            </div>
          </div>

          <button type="submit" className={primaryButtonClass} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : 'Ajouter l’expérience'}
          </button>
        </form>
      </section>
    </div>
  );
}

function ExperienceRow({
  experience,
  deleting,
  onEdit,
  onDelete,
  onFeedback,
  onRefresh,
}: {
  experience: OwnedExperience;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onFeedback: (feedback: Feedback) => void;
  onRefresh: () => void;
}) {
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [proofPending, setProofPending] = useState(false);
  const [proofViewPending, setProofViewPending] = useState(false);

  async function uploadProof(file: File) {
    if (file.size > MAX_PROOF_BYTES) {
      onFeedback({ type: 'error', message: 'Le justificatif dépasse 10 Mo.' });
      return;
    }
    setProofPending(true);
    onFeedback(null);
    try {
      const form = new FormData();
      form.append('file', file);
      await browserApi<OwnedExperience>(`/profiles/me/experiences/${experience.id}/proof`, {
        method: 'POST',
        body: form,
      });
      onFeedback({
        type: 'success',
        message: 'Justificatif envoyé. L’expérience repasse en attente de vérification.',
      });
      onRefresh();
    } catch (error) {
      onFeedback({ type: 'error', message: browserApiMessage(error) });
    } finally {
      setProofPending(false);
    }
  }

  async function viewProof() {
    setProofViewPending(true);
    onFeedback(null);
    const tab = window.open('', '_blank');
    if (tab) {
      tab.opener = null;
    }
    try {
      const { url } = await browserApi<{ url: string }>(
        `/profiles/me/experiences/${experience.id}/proof/url`,
      );
      if (tab) {
        tab.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      tab?.close();
      onFeedback({ type: 'error', message: browserApiMessage(error) });
    } finally {
      setProofViewPending(false);
    }
  }

  async function deleteProof() {
    if (!window.confirm('Supprimer ce justificatif ?')) {
      return;
    }
    setProofPending(true);
    onFeedback(null);
    try {
      await browserApi<OwnedExperience>(`/profiles/me/experiences/${experience.id}/proof`, {
        method: 'DELETE',
      });
      onFeedback({ type: 'success', message: 'Justificatif supprimé.' });
      onRefresh();
    } catch (error) {
      onFeedback({ type: 'error', message: browserApiMessage(error) });
    } finally {
      setProofPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{experience.title}</p>
            <span
              className={`${badgeClass} ${
                experience.verified
                  ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                  : 'bg-amber-50 text-amber-800 ring-amber-200'
              }`}
            >
              {experience.verified ? 'Vérifiée' : 'En attente de vérification'}
            </span>
            {experience.hasProof ? (
              <span className={`${badgeClass} bg-slate-100 text-slate-700 ring-slate-200`}>
                Justificatif joint
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">{experience.org}</p>
          <p className="text-xs text-slate-500">
            {formatDate(experience.startDate)} —{' '}
            {experience.endDate ? formatDate(experience.endDate) : 'en cours'} · mise à jour le{' '}
            {formatDateTime(experience.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButtonClass} onClick={onEdit}>
            Modifier
          </button>
          <button
            type="button"
            className={dangerButtonClass}
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <input
          ref={proofInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={proofPending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) {
              void uploadProof(file);
            }
          }}
        />
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => proofInputRef.current?.click()}
          disabled={proofPending}
        >
          {proofPending
            ? 'Envoi…'
            : experience.hasProof
              ? 'Remplacer le justificatif'
              : 'Joindre un justificatif'}
        </button>
        {experience.hasProof ? (
          <>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => void viewProof()}
              disabled={proofViewPending}
            >
              {proofViewPending ? 'Ouverture…' : 'Voir le justificatif'}
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              onClick={() => void deleteProof()}
              disabled={proofPending}
            >
              Retirer le justificatif
            </button>
          </>
        ) : null}
        <p className="text-[11px] text-slate-500">PDF ou image, 10 Mo maximum.</p>
      </div>
    </div>
  );
}

function ExperienceEditForm({
  experience,
  onCancel,
  onSaved,
  onError,
}: {
  experience: OwnedExperience;
  onCancel: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: experienceToFormValues(experience),
  });

  const onUpdate = handleSubmit(async (values) => {
    try {
      await browserApi<OwnedExperience>(`/profiles/me/experiences/${experience.id}`, {
        method: 'PATCH',
        body: JSON.stringify(experienceToPayload(values)),
      });
      onSaved('Expérience mise à jour. Elle repasse en attente de vérification.');
    } catch (error) {
      onError(browserApiMessage(error));
    }
  });

  return (
    <form className="space-y-4" onSubmit={onUpdate} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`title-${experience.id}`}>
            Intitulé
          </label>
          <input
            id={`title-${experience.id}`}
            className={inputClass}
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
          {errors.title ? <p className={errorTextClass}>{errors.title.message}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor={`org-${experience.id}`}>
            Organisation
          </label>
          <input
            id={`org-${experience.id}`}
            className={inputClass}
            aria-invalid={Boolean(errors.org)}
            {...register('org')}
          />
          {errors.org ? <p className={errorTextClass}>{errors.org.message}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor={`start-${experience.id}`}>
            Date de début
          </label>
          <input
            id={`start-${experience.id}`}
            type="date"
            className={inputClass}
            aria-invalid={Boolean(errors.startDate)}
            {...register('startDate')}
          />
          {errors.startDate ? <p className={errorTextClass}>{errors.startDate.message}</p> : null}
        </div>
        <div>
          <label className={labelClass} htmlFor={`end-${experience.id}`}>
            Date de fin (facultatif)
          </label>
          <input
            id={`end-${experience.id}`}
            type="date"
            className={inputClass}
            aria-invalid={Boolean(errors.endDate)}
            {...register('endDate')}
          />
          {errors.endDate ? <p className={errorTextClass}>{errors.endDate.message}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButtonClass} disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
