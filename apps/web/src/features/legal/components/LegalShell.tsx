import Link from 'next/link';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/shared/components/SiteFooter';
import { SiteHeader } from '@/shared/components/SiteHeader';

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
    <div className="min-h-screen bg-ivory-100">
      <SiteHeader variant="solid" />

      <main className="pt-[76px]">
        <div className="relative overflow-hidden border-b border-ink-900/10 bg-ivory-200/70">
          <div className="container-editorial relative py-16 sm:py-20">
            <p className="eyebrow">Document juridique</p>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.6rem,5vw,4.4rem)] font-light leading-[1.02] tracking-sharpest text-ink-950">
              {title}
            </h1>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
              Dernière mise à jour : {updatedAt}
            </p>
          </div>
        </div>

        <div className="container-editorial py-14 sm:py-16">
          <div className="max-w-3xl space-y-10 text-sm leading-7 text-ink-700">{children}</div>

          <div className="mt-16 flex flex-col gap-4 border-t border-ink-900/10 pt-8 text-[11px] uppercase tracking-widest text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p>ModelBénin — Cotonou, Bénin</p>
            <nav className="flex flex-wrap gap-5">
              <Link className="transition-colors hover:text-gold-700" href="/confidentialite">
                Confidentialité
              </Link>
              <Link className="transition-colors hover:text-gold-700" href="/mentions-legales">
                Mentions légales
              </Link>
              <Link className="transition-colors hover:text-gold-700" href="/inscription">
                Créer un compte
              </Link>
            </nav>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ink-900/10 pt-6">
      <h2 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink-950">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalPlaceholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-gold-100 px-1 font-medium text-gold-800 ring-1 ring-inset ring-gold-200">
      {children}
    </span>
  );
}
