import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { safeRedirectPath } from '@/shared/lib/redirect';
import { alertSuccessClass } from '@/shared/lib/ui';

export const metadata: Metadata = { title: 'Connexion' };

type LoginPageProps = {
  searchParams: Promise<{ next?: string; compte?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, compte } = await searchParams;

  return (
    <AuthShell
      title="Se connecter"
      subtitle="Retrouvez votre profil, vos photos et vos conversations."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link className="font-semibold text-brand-800 hover:text-brand-900" href="/inscription">
            Créer un compte
          </Link>
        </>
      }
    >
      {compte === 'supprime' ? (
        <p className={alertSuccessClass} role="status">
          Votre compte a bien été supprimé. Merci d’avoir utilisé ModelBénin.
        </p>
      ) : null}
      <LoginForm nextPath={safeRedirectPath(next)} />
    </AuthShell>
  );
}
