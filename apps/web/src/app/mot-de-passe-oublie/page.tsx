import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Recevez un lien sécurisé pour retrouver l’accès à votre compte."
      footer={
        <>
          Vous vous en souvenez finalement ?{' '}
          <Link className="font-semibold text-brand-800 hover:text-brand-900" href="/connexion">
            Se connecter
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
