'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import {
  alertErrorClass,
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '@/shared/lib/ui';

type LoginFormProps = {
  nextPath: string;
};

type Challenge = {
  challengeToken: string;
  setupRequired: boolean;
};

type Enrollment = {
  secret: string;
  otpauthUrl: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const completeSession = () => {
    router.replace(nextPath);
    router.refresh();
  };

  const startEnrollment = async (challengeToken: string) => {
    const response = await fetch('/api/auth/2fa/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ challengeToken }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      secret?: string;
      otpauthUrl?: string;
    };
    if (!response.ok || !payload.secret || !payload.otpauthUrl) {
      setFormError(
        payload.message ?? "Impossible d'initialiser la double authentification.",
      );
      return;
    }
    setEnrollment({ secret: payload.secret, otpauthUrl: payload.otpauthUrl });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      challengeToken?: string;
      twoFactorSetupRequired?: boolean;
    };

    if (!response.ok) {
      setFormError(payload.message ?? 'Connexion impossible.');
      return;
    }

    if (payload.challengeToken) {
      const nextChallenge: Challenge = {
        challengeToken: payload.challengeToken,
        setupRequired: Boolean(payload.twoFactorSetupRequired),
      };
      setChallenge(nextChallenge);
      if (nextChallenge.setupRequired) {
        await startEnrollment(nextChallenge.challengeToken);
      }
      return;
    }

    completeSession();
  });

  const onVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge) {
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setFormError('Le code de vérification doit contenir six chiffres.');
      return;
    }

    setIsVerifying(true);
    setFormError(null);
    const endpoint = challenge.setupRequired ? 'enable' : 'verify';
    const response = await fetch(`/api/auth/2fa/${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ challengeToken: challenge.challengeToken, code }),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setIsVerifying(false);

    if (!response.ok) {
      setFormError(payload.message ?? 'Code de vérification invalide.');
      return;
    }

    completeSession();
  };

  if (challenge) {
    return (
      <form className="space-y-5" onSubmit={onVerify} noValidate>
        {formError ? (
          <p className={alertErrorClass} role="alert">
            {formError}
          </p>
        ) : null}

        {challenge.setupRequired ? (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              Double authentification obligatoire pour les administrateurs
            </p>
            {enrollment ? (
              <>
                <p>
                  Ajoutez ce compte dans votre application d’authentification (Google
                  Authenticator, 1Password, Authy…), puis saisissez le code à six chiffres
                  qu’elle affiche.
                </p>
                <p className="break-all">
                  Clé :{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
                    {enrollment.secret}
                  </code>
                </p>
                <a
                  className="inline-block text-xs font-semibold text-brand-800 underline hover:text-brand-900"
                  href={enrollment.otpauthUrl}
                >
                  Ouvrir le lien d’enrôlement
                </a>
              </>
            ) : (
              <p>Génération de votre clé d’authentification…</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Saisissez le code à six chiffres généré par votre application
            d’authentification.
          </p>
        )}

        <div>
          <label className={labelClass} htmlFor="two-factor-code">
            Code de vérification
          </label>
          <input
            id="two-factor-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            className={inputClass}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          />
        </div>

        <button
          type="submit"
          className={`${primaryButtonClass} w-full`}
          disabled={isVerifying || (challenge.setupRequired && !enrollment)}
        >
          {isVerifying
            ? 'Vérification…'
            : challenge.setupRequired
              ? 'Activer la double authentification'
              : 'Valider le code'}
        </button>

        <button
          type="button"
          className="w-full text-sm font-semibold text-slate-600 hover:text-slate-900"
          onClick={() => {
            setChallenge(null);
            setEnrollment(null);
            setCode('');
            setFormError(null);
          }}
        >
          Revenir à la connexion
        </button>
      </form>
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
        <div className="flex items-center justify-between gap-3">
          <label className={labelClass} htmlFor="password">
            Mot de passe
          </label>
          <Link
            className="text-xs font-semibold text-brand-800 hover:text-brand-900"
            href="/mot-de-passe-oublie"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? <p className={errorTextClass}>{errors.password.message}</p> : null}
      </div>

      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={isSubmitting}>
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
