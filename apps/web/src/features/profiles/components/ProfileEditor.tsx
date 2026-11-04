'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  formValuesToPayload,
  profileFormSchema,
  profileToFormValues,
  type ProfileFormValues,
} from '@/features/profiles/schemas';
import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { PROFILE_LEVEL_LABELS, VISIBILITY_LABELS, formatDateTime } from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  badgeClass,
  errorTextClass,
  hintTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { ModelProfile } from '@/shared/types/api';

type ProfileEditorProps = {
  initialProfile: ModelProfile | null;
};

type Feedback = { type: 'success' | 'error'; message: string } | null;

export function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ModelProfile | null>(initialProfile);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileToFormValues(initialProfile),
  });

  const visibility = watch('visibility');
  const canBePublic = profile?.level === 'CONFIRME';
  const isCreation = !profile;

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null);
    const payload = formValuesToPayload(values);
    try {
      const saved = await browserApi<ModelProfile>('/profiles/me', {
        method: profile ? 'PATCH' : 'POST',
        // La création est toujours privée : la visibilité s'ouvre après
        // l'approbation des trois photos guidées.
        body: JSON.stringify(isCreation ? { ...payload, visibility: 'PRIVATE' } : payload),
      });
      setProfile(saved);
      reset(profileToFormValues(saved));
      setFeedback({ type: 'success', message: 'Profil enregistré.' });
      router.refresh();
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mon profil</h1>
        {profile ? (
          <>
            <span className={`${badgeClass} bg-brand-50 text-brand-800 ring-brand-200`}>
              {PROFILE_LEVEL_LABELS[profile.level]}
            </span>
            <span className={`${badgeClass} bg-slate-50 text-slate-700 ring-slate-200`}>
              {VISIBILITY_LABELS[profile.visibility]}
            </span>
          </>
        ) : (
          <span className={`${badgeClass} bg-amber-50 text-amber-800 ring-amber-200`}>
            Profil à créer
          </span>
        )}
      </div>

      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        {profile
          ? 'Les informations marquées comme sensibles (date de naissance, mensurations) sont chiffrées au repos et ne sont jamais exposées aux agences.'
          : 'Créez votre profil pour pouvoir téléverser vos trois photos guidées. Il restera privé jusqu’à leur approbation.'}
      </p>

      {feedback ? (
        <p
          className={feedback.type === 'success' ? alertSuccessClass : alertErrorClass}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Identité</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="displayName">
                Nom affiché
              </label>
              <input
                id="displayName"
                className={inputClass}
                autoComplete="name"
                aria-invalid={Boolean(errors.displayName)}
                {...register('displayName')}
              />
              {errors.displayName ? (
                <p className={errorTextClass}>{errors.displayName.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="birthDate">
                Date de naissance
              </label>
              <input
                id="birthDate"
                type="date"
                className={inputClass}
                aria-invalid={Boolean(errors.birthDate)}
                {...register('birthDate')}
              />
              {errors.birthDate ? (
                <p className={errorTextClass}>{errors.birthDate.message}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="city">
                Ville
              </label>
              <input
                id="city"
                className={inputClass}
                autoComplete="address-level2"
                aria-invalid={Boolean(errors.city)}
                {...register('city')}
              />
              {errors.city ? <p className={errorTextClass}>{errors.city.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Mensurations
          </h2>
          <p className={hintTextClass}>
            En centimètres. Laissez vide si vous ne souhaitez pas renseigner une mesure.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ['heightCm', 'Taille (cm)'],
                ['chestCm', 'Poitrine (cm)'],
                ['waistCm', 'Taille / tour de taille (cm)'],
                ['hipsCm', 'Hanches (cm)'],
                ['shoeSize', 'Pointure'],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className={labelClass} htmlFor={field}>
                  {label}
                </label>
                <input
                  id={field}
                  inputMode="numeric"
                  className={inputClass}
                  aria-invalid={Boolean(errors[field])}
                  {...register(field)}
                />
                {errors[field] ? <p className={errorTextClass}>{errors[field]?.message}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Visibilité
          </h2>
          <div className="mt-4 max-w-md">
            <label className={labelClass} htmlFor="visibility">
              Qui peut consulter mon profil ?
            </label>
            <select
              id="visibility"
              className={inputClass}
              disabled={isCreation}
              {...register('visibility')}
            >
              {isCreation ? (
                <option value="PRIVATE">Privé — personne</option>
              ) : (
                <>
                  <option value="PRIVATE">Privé — personne</option>
                  <option value="VERIFIED_AGENCIES">Agences vérifiées uniquement</option>
                  {canBePublic ? <option value="PUBLIC">Public</option> : null}
                </>
              )}
            </select>
            {errors.visibility ? (
              <p className={errorTextClass}>{errors.visibility.message}</p>
            ) : null}
            <p className={hintTextClass}>
              {isCreation
                ? 'Votre profil est créé en privé. Vous pourrez choisir sa visibilité après l’approbation de vos trois photos guidées.'
                : visibility === 'PRIVATE'
                  ? 'Votre profil reste invisible. Les photos restent stockées et modérées.'
                  : visibility === 'VERIFIED_AGENCIES'
                    ? 'Nécessite un portrait et deux photos en pied approuvés.'
                    : 'Réservé aux profils confirmés : un profil débutant ne peut jamais être public.'}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Présentation
          </h2>
          <div className="mt-4">
            <label className={labelClass} htmlFor="bio">
              Biographie
            </label>
            <textarea
              id="bio"
              rows={5}
              className={inputClass}
              placeholder="Votre parcours, vos envies, le type de projets qui vous intéressent…"
              aria-invalid={Boolean(errors.bio)}
              {...register('bio')}
            />
            {errors.bio ? <p className={errorTextClass}>{errors.bio.message}</p> : null}
            <p className={hintTextClass}>
              N’indiquez pas votre adresse, votre numéro ou vos réseaux : la messagerie de la
              plateforme les filtre.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            className={primaryButtonClass}
            disabled={isSubmitting || (!isDirty && Boolean(profile))}
          >
            {isSubmitting
              ? 'Enregistrement…'
              : profile
                ? 'Enregistrer les modifications'
                : 'Créer mon profil'}
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              reset(profileToFormValues(profile));
              setFeedback(null);
            }}
            disabled={isSubmitting || !isDirty}
          >
            Annuler
          </button>
          {profile ? (
            <p className="text-xs text-slate-500">
              Dernière mise à jour : {formatDateTime(profile.updatedAt)}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
