'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  alertErrorClass,
  alertSuccessClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';

type VerifyEmailFormProps = {
  initialToken: string;
};

export function VerifyEmailForm({ initialToken }: VerifyEmailFormProps) {
  const [token, setToken] = useState(initialToken);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    initialToken ? 'loading' : 'idle',
  );
  const [message, setMessage] = useState<string | null>(null);
  const attempted = useRef(false);

  const verify = useCallback(async (value: string) => {
    setState('loading');
    setMessage(null);
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: value }),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setState('error');
      setMessage(payload.message ?? 'Vérification impossible.');
      return;
    }
    setState('success');
    setMessage(payload.message ?? 'Adresse e-mail vérifiée avec succès.');
  }, []);

  useEffect(() => {
    if (initialToken && !attempted.current) {
      attempted.current = true;
      void verify(initialToken);
    }
  }, [initialToken, verify]);

  if (state === 'success') {
    return (
      <div className="space-y-5">
        <p className={alertSuccessClass}>{message}</p>
        <p className="text-sm text-slate-600">
          Votre adresse est confirmée. Connectez-vous pour compléter votre profil et ajouter vos
          photos.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className={`${primaryButtonClass} w-full sm:w-auto`} href="/connexion">
            Se connecter
          </Link>
          <Link className={`${secondaryButtonClass} w-full sm:w-auto`} href="/dashboard">
            Mon espace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void verify(token);
      }}
    >
      {state === 'error' && message ? (
        <p className={alertErrorClass} role="alert">
          {message}
        </p>
      ) : null}
      {state === 'loading' ? (
        <p className="text-sm text-slate-600">Vérification en cours…</p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="token">
          Jeton de vérification
        </label>
        <input
          id="token"
          className={inputClass}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        className={`${primaryButtonClass} w-full`}
        disabled={state === 'loading'}
      >
        Vérifier mon adresse
      </button>
    </form>
  );
}
