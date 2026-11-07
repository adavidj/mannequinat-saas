'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas';
import {
  alertErrorClass,
  alertSuccessClass,
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/shared/lib/ui';

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSentMessage(null);
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setFormError(payload.message ?? 'Demande impossible pour le moment.');
      return;
    }

    setSentMessage(
      payload.message ??
        'Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d’être envoyé.',
    );
  });

  if (sentMessage) {
    return (
      <div className="space-y-5">
        <p className={alertSuccessClass} role="status">
          {sentMessage}
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Vérifiez votre boîte de réception et vos indésirables. Le lien est valable 30 minutes et
          ne peut être utilisé qu’une seule fois.
        </p>
        <Link className={`${primaryButtonClass} w-full`} href="/connexion">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {formError ? (
        <p className={alertErrorClass} role="alert">
          {formError}
        </p>
      ) : null}

      <p className="text-sm leading-6 text-slate-600">
        Indiquez l’adresse e-mail associée à votre compte. Nous vous enverrons un lien sécurisé pour
        choisir un nouveau mot de passe.
      </p>

      <div>
        <label className={labelClass} htmlFor="email">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? <p className={errorTextClass}>{errors.email.message}</p> : null}
      </div>

      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={isSubmitting}>
        {isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
      </button>
    </form>
  );
}
