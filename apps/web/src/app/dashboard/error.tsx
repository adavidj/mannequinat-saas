'use client';

import Link from 'next/link';

import { alertErrorClass, primaryButtonClass, secondaryButtonClass } from '@/shared/lib/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-10">
      <h1 className="text-xl font-bold text-slate-900">Impossible de charger cette page</h1>
      <p className={alertErrorClass}>{error.message || 'Une erreur inattendue est survenue.'}</p>
      <p className="text-sm text-slate-600">
        Vérifiez que l’API est démarrée et que votre session est toujours valide.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" className={primaryButtonClass} onClick={reset}>
          Réessayer
        </button>
        <Link className={secondaryButtonClass} href="/dashboard">
          Retour à la vue d’ensemble
        </Link>
      </div>
    </div>
  );
}
