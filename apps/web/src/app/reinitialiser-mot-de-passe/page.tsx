import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = { title: 'Réinitialiser mon mot de passe' };

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe solide et unique pour sécuriser votre compte."
      footer={
        <>
          Besoin d’un nouveau lien ?{' '}
          <Link
            className="font-semibold text-brand-800 hover:text-brand-900"
            href="/mot-de-passe-oublie"
          >
            Recommencer
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token?.trim() ?? ''} />
    </AuthShell>
  );
}
