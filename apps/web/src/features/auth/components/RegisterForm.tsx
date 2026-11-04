'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas';
import {
  alertErrorClass,
  alertInfoClass,
  alertSuccessClass,
  errorTextClass,
  hintTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';

type RegisterResult = {
  emailVerificationToken?: string;
  message?: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', role: 'MODELE', birthDate: '' },
  });

  const role = watch('role');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        role: values.role,
        ...(values.birthDate ? { birthDate: values.birthDate } : {}),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as RegisterResult & {
      message?: string;
    };

    if (!response.ok) {
      setFormError(payload.message ?? 'Inscription impossible.');
      return;
    }

    setResult(payload);
    router.refresh();
  });

  if (result) {
    return (
      <div className="space-y-5">
        <p className={alertSuccessClass}>
          Votre compte est créé. Il reste une étape : confirmer votre adresse e-mail.
        </p>

        {result.emailVerificationToken ? (
          <div className="space-y-3">
            <p className={alertInfoClass}>
              Mode développement : aucun e-mail n’est encore envoyé. Utilisez le lien ci-dessous
              pour vérifier votre adresse immédiatement.
            </p>
            <Link
              className={`${primaryButtonClass} w-full`}
              href={`/verifier-email?token=${encodeURIComponent(result.emailVerificationToken)}`}
            >
              Vérifier mon adresse e-mail
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Ouvrez le lien de vérification reçu par e-mail, puis revenez vous connecter.
          </p>
        )}

        <Link className={`${secondaryButtonClass} w-full`} href="/dashboard">
          Accéder à mon espace
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

      <div>
        <label className={labelClass} htmlFor="role">
          Je crée un compte
        </label>
        <select id="role" className={inputClass} {...register('role')}>
          <option value="MODELE">Modèle / mannequin</option>
          <option value="AGENCE">Agence ou recruteur</option>
          <option value="FORMATEUR">Organisme de formation</option>
        </select>
        {errors.role ? <p className={errorTextClass}>{errors.role.message}</p> : null}
      </div>

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

      <div>
        <label className={labelClass} htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        <p className={hintTextClass}>
          10 caractères minimum, avec majuscule, minuscule et chiffre.
        </p>
        {errors.password ? <p className={errorTextClass}>{errors.password.message}</p> : null}
      </div>

      {role === 'MODELE' ? (
        <div>
          <label className={labelClass} htmlFor="birthDate">
            Date de naissance
          </label>
          <input
            id="birthDate"
            type="date"
            autoComplete="bday"
            className={inputClass}
            aria-invalid={Boolean(errors.birthDate)}
            {...register('birthDate')}
          />
          <p className={hintTextClass}>
            La plateforme est réservée aux personnes majeures (18 ans et plus).
          </p>
          {errors.birthDate ? <p className={errorTextClass}>{errors.birthDate.message}</p> : null}
        </div>
      ) : null}

      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={isSubmitting}>
        {isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
      </button>
    </form>
  );
}
