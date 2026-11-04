import Link from 'next/link';
import type { ReactNode } from 'react';

export function LegalShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-brand-800">
            ModelBénin
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Retour à l’accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Document juridique
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Dernière mise à jour : {updatedAt}</p>
        <div className="mt-8 space-y-8 text-sm leading-6 text-slate-700">{children}</div>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} ModelBénin — Cotonou, Bénin.</p>
          <nav className="flex flex-wrap gap-4">
            <Link
              className="font-medium text-slate-600 hover:text-slate-900"
              href="/confidentialite"
            >
              Confidentialité
            </Link>
            <Link
              className="font-medium text-slate-600 hover:text-slate-900"
              href="/mentions-legales"
            >
              Mentions légales
            </Link>
            <Link className="font-medium text-slate-600 hover:text-slate-900" href="/inscription">
              Créer un compte
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalPlaceholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-amber-50 px-1 font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
      {children}
    </span>
  );
}
