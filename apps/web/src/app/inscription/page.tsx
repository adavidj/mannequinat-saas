import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = { title: 'Créer un compte' };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Un compte unique pour les modèles, les agences et les organismes de formation."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link className="font-semibold text-brand-800 hover:text-brand-900" href="/connexion">
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
