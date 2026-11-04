'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  organizationFormSchema,
  organizationToPayload,
  organizationTypesForRole,
  type OrganizationFormValues,
} from '@/features/organizations/schemas';
import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import {
  ORGANIZATION_TYPE_LABELS,
  VERIFICATION_LABELS,
  VERIFICATION_STYLES,
  formatDateTime,
} from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  badgeClass,
  cardClass,
  errorTextClass,
  hintTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/shared/lib/ui';
import type { OwnedOrganization, UserRole } from '@/shared/types/api';

type OrganizationManagerProps = {
  role: UserRole;
  organizations: OwnedOrganization[];
};

type Feedback = { type: 'success' | 'error'; message: string } | null;

export function OrganizationManager({ role, organizations }: OrganizationManagerProps) {
  const router = useRouter();
  const allowedTypes = organizationTypesForRole(role);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      type: allowedTypes[0] ?? 'AGENCY',
      name: '',
      ifu: '',
      rccm: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null);
    try {
      const created = await browserApi<OwnedOrganization>('/organizations/me', {
        method: 'POST',
        body: JSON.stringify(organizationToPayload(values)),
      });
      reset({ type: allowedTypes[0] ?? 'AGENCY', name: '', ifu: '', rccm: '' });
      setFeedback({
        type: 'success',
        message: `« ${created.name} » a été enregistrée. Notre équipe vérifie le justificatif avant l’ouverture de la découverte.`,
      });
      router.refresh();
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mon organisation</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          La vérification de votre organisation conditionne l’accès à la découverte et à la
          messagerie. Les numéros IFU et RCCM sont chiffrés au repos et ne sont visibles que par
          l’équipe de vérification.
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
        <h2 className="text-lg font-semibold text-slate-900">Organisations déclarées</h2>
        {organizations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Aucune organisation déclarée pour le moment. Utilisez le formulaire ci-dessous.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {organizations.map((organization) => (
              <li key={organization.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{organization.name}</p>
                    <p className="text-xs text-slate-500">
                      {ORGANIZATION_TYPE_LABELS[organization.type]} · déclarée le{' '}
                      {formatDateTime(organization.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`${badgeClass} ${VERIFICATION_STYLES[organization.verificationStatus]}`}
                  >
                    {VERIFICATION_LABELS[organization.verificationStatus]}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-700">IFU</dt>
                    <dd>{organization.ifu ?? 'Non renseigné'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-700">RCCM</dt>
                    <dd>{organization.rccm ?? 'Non renseigné'}</dd>
                  </div>
                </dl>
                {organization.verificationStatus === 'PENDING' ? (
                  <p className={`${hintTextClass} mt-3`}>
                    Vérification en cours. Vous recevrez une notification dès qu’une décision sera
                    prise.
                  </p>
                ) : null}
                {organization.verificationStatus === 'REJECTED' ? (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    Vérification refusée. Contrôlez les numéros saisis puis contactez notre équipe
                    pour une nouvelle demande.
                  </p>
                ) : null}
                {organization.verificationStatus === 'VERIFIED' ? (
                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    Organisation vérifiée : la découverte et la messagerie sont accessibles depuis
                    votre tableau de bord.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Ajouter une organisation</h2>
        <p className={hintTextClass}>
          Un seul justificatif suffit : IFU ou RCCM. Les deux sont acceptés.
        </p>

        <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="type">
                Type d’organisation
              </label>
              <select
                id="type"
                className={inputClass}
                disabled={allowedTypes.length === 1}
                {...register('type')}
              >
                {allowedTypes.map((type) => (
                  <option key={type} value={type}>
                    {ORGANIZATION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.type ? <p className={errorTextClass}>{errors.type.message}</p> : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="name">
                Nom de l’organisation
              </label>
              <input
                id="name"
                className={inputClass}
                autoComplete="organization"
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
              {errors.name ? <p className={errorTextClass}>{errors.name.message}</p> : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="ifu">
                Numéro IFU
              </label>
              <input
                id="ifu"
                className={inputClass}
                aria-invalid={Boolean(errors.ifu)}
                {...register('ifu')}
              />
              {errors.ifu ? <p className={errorTextClass}>{errors.ifu.message}</p> : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="rccm">
                Numéro RCCM
              </label>
              <input
                id="rccm"
                className={inputClass}
                aria-invalid={Boolean(errors.rccm)}
                {...register('rccm')}
              />
              {errors.rccm ? <p className={errorTextClass}>{errors.rccm.message}</p> : null}
            </div>
          </div>

          <button type="submit" className={primaryButtonClass} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : 'Envoyer pour vérification'}
          </button>
        </form>
      </section>
    </div>
  );
}
