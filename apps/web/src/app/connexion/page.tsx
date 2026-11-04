import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { safeRedirectPath } from '@/shared/lib/redirect';

export const metadata: Metadata = { title: 'Connexion' };

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

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
      <LoginForm nextPath={safeRedirectPath(next)} />
    </AuthShell>
  );
}
