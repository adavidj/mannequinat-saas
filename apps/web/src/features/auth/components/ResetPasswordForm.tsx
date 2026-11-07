'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/schemas';
import {
  alertErrorClass,
  alertSuccessClass,
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="space-y-5">
        <p className={alertErrorClass} role="alert">
          Ce lien de réinitialisation est incomplet. Demandez un nouveau lien pour continuer.
        </p>
        <Link className={`${primaryButtonClass} w-full`} href="/mot-de-passe-oublie">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="space-y-5">
        <p className={alertSuccessClass} role="status">
          {successMessage}
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Par sécurité, toutes vos sessions actives ont été déconnectées.
        </p>
        <Link className={`${primaryButtonClass} w-full`} href="/connexion">
          Se connecter
        </Link>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, ...values }),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setFormError(payload.message ?? 'Réinitialisation impossible.');
      return;
    }

    setSuccessMessage(
      payload.message ?? 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.',
    );
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {formError ? (
        <p className={alertErrorClass} role="alert">
          {formError}
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="password">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? <p className={errorTextClass}>{errors.password.message}</p> : null}
        <p className="mt-1 text-xs text-slate-500">
          Au moins 10 caractères, avec une majuscule, une minuscule et un chiffre.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="confirmPassword">
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p className={errorTextClass}>{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : 'Choisir ce mot de passe'}
      </button>

      <Link className={`${secondaryButtonClass} w-full`} href="/connexion">
        Annuler
      </Link>
    </form>
  );
}
