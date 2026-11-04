import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm';

export const metadata: Metadata = { title: 'Vérifier mon e-mail' };

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Vérifier mon adresse e-mail"
      subtitle="La vérification de l’adresse e-mail est obligatoire avant de créer un profil ou d’utiliser la messagerie."
      footer={
        <>
          Besoin de vous connecter ?{' '}
          <Link className="font-semibold text-brand-800 hover:text-brand-900" href="/connexion">
            Connexion
          </Link>
        </>
      }
    >
      <VerifyEmailForm initialToken={token?.trim() ?? ''} />
    </AuthShell>
  );
}
