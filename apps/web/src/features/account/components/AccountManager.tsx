'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { deleteAccountFormSchema, type DeleteAccountFormValues } from '@/features/account/schemas';
import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import {
  alertErrorClass,
  alertSuccessClass,
  cardClass,
  dangerButtonClass,
  errorTextClass,
  hintTextClass,
  inputClass,
  labelClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';

type Feedback = { type: 'success' | 'error'; message: string } | null;

async function readExportError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : 'L’export a échoué. Réessayez dans un instant.';
}

export function AccountManager({ email }: { email: string }) {
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountFormSchema),
    defaultValues: { password: '', confirmation: '' },
  });

  async function exportData() {
    setExporting(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/proxy/account/export', {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(await readExportError(response));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `modelbenin-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFeedback({
        type: 'success',
        message: 'Votre export a été téléchargé au format JSON.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'L’export a échoué. Réessayez dans un instant.',
      });
    } finally {
      setExporting(false);
    }
  }

  const onDelete = handleSubmit(async (values) => {
    if (
      !window.confirm(
        'Cette action est définitive : votre profil, vos photos, vos expériences et vos conversations seront supprimés. Continuer ?',
      )
    ) {
      return;
    }
    setFeedback(null);
    try {
      await browserApi<{ message: string }>('/account', {
        method: 'DELETE',
        body: JSON.stringify(values),
      });
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      window.location.assign('/connexion?compte=supprime');
    } catch (error) {
      setFeedback({ type: 'error', message: browserApiMessage(error) });
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mon compte</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Gérez les données rattachées à <span className="font-medium">{email}</span>. Vous pouvez
          les exporter à tout moment ou demander la suppression définitive de votre compte.
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
        <h2 className="text-lg font-semibold text-slate-900">Exporter mes données</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Vous recevez un fichier JSON contenant votre compte, votre profil, vos photos (sans les
          fichiers), vos expériences, vos organisations, vos conversations, vos abonnements, vos
          paiements et vos signalements.
        </p>
        <button
          type="button"
          className={`${secondaryButtonClass} mt-4`}
          onClick={() => void exportData()}
          disabled={exporting}
        >
          {exporting ? 'Préparation de l’export…' : 'Télécharger mes données'}
        </button>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Supprimer mon compte</h2>
        <div className="mt-2 max-w-2xl space-y-2 text-sm leading-6 text-slate-600">
          <p>
            La suppression retire immédiatement votre profil, vos photos, vos justificatifs, vos
            expériences, vos organisations et vos conversations. Les fichiers du stockage sont
            purgés et les sauvegardes suivent leur cycle de purge.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Les données de facturation sont conservées 10 ans (obligation comptable).</li>
            <li>Les journaux de sécurité sont conservés 12 mois.</li>
            <li>Votre adresse e-mail est remplacée par un identifiant anonyme.</li>
          </ul>
          <p>
            Pour exercer vos autres droits, consultez la{' '}
            <Link
              className="font-semibold text-brand-800 hover:text-brand-900"
              href="/confidentialite"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>

        <form className="mt-5 max-w-md space-y-4" onSubmit={onDelete} noValidate>
          <div>
            <label className={labelClass} htmlFor="delete-password">
              Mot de passe actuel
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password ? <p className={errorTextClass}>{errors.password.message}</p> : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="delete-confirmation">
              Saisissez SUPPRIMER pour confirmer
            </label>
            <input
              id="delete-confirmation"
              className={inputClass}
              autoComplete="off"
              aria-invalid={Boolean(errors.confirmation)}
              {...register('confirmation')}
            />
            {errors.confirmation ? (
              <p className={errorTextClass}>{errors.confirmation.message}</p>
            ) : null}
            <p className={hintTextClass}>
              Cette action est définitive. Elle ne peut pas être annulée depuis votre espace.
            </p>
          </div>

          <button type="submit" className={dangerButtonClass} disabled={isSubmitting}>
            {isSubmitting ? 'Suppression…' : 'Supprimer définitivement mon compte'}
          </button>
        </form>

        <p className={`${hintTextClass} mt-4`}>
          Un problème ?{' '}
          <Link className="font-semibold text-brand-800" href="/confidentialite">
            Contactez-nous via la page confidentialité
          </Link>
          .
        </p>
      </section>

      <p className="text-sm text-slate-500">
        <Link className="font-semibold text-brand-800 hover:text-brand-900" href="/dashboard">
          Retour à la vue d’ensemble
        </Link>
      </p>
    </div>
  );
}
