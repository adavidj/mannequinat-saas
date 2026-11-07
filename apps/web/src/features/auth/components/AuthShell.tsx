import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowRightIcon, CheckIcon } from '@/shared/components/icons';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-ivory-100 lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 px-12 py-10 text-ivory-50 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="grain pointer-events-none absolute inset-0 opacity-60" />
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-brand-800/30 blur-[130px]" />
          <div className="absolute -right-24 bottom-0 h-[460px] w-[460px] rounded-full bg-gold-700/20 blur-[140px]" />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-6 select-none font-display text-[22rem] font-light leading-none text-white/[0.03]"
        >
          MB
        </span>

        <Link href="/" className="relative inline-flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-medium tracking-sharpest">
            Model<span className="italic text-gold-400">Bénin</span>
          </span>
          <span className="h-1 w-1 translate-y-[-2px] rounded-full bg-gold-400" />
        </Link>

        <div className="relative max-w-lg py-16">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">
            La maison du mannequinat béninois
          </p>
          <p className="mt-8 font-display text-[clamp(2.6rem,4vw,3.8rem)] font-light leading-[1.02] tracking-sharpest">
            Une carrière se construit sur la
            <span className="italic text-gold-300"> confiance</span>, pas sur l’apparence.
          </p>
          <p className="mt-7 max-w-md text-sm leading-7 text-ivory-100/50">
            Profils modérés, agences authentifiées, visibilité par paliers : votre image reste sous
            votre contrôle, à chaque étape.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              'Trois photos guidées, validées par un humain',
              'Aucune visibilité publique sans consentement',
              'Signalement et blocage à tout moment',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[13px] text-ivory-100/65">
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[9px] uppercase tracking-widest text-ivory-100/30">
          Cotonou · Bénin — Réservé aux 18 ans et plus
        </p>
      </aside>

      <section className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-6 sm:px-10">
          <Link href="/" className="inline-flex items-baseline gap-1.5 lg:hidden">
            <span className="font-display text-2xl font-medium tracking-sharpest text-ink-950">
              Model<span className="italic text-gold-600">Bénin</span>
            </span>
            <span className="h-1 w-1 translate-y-[-2px] rounded-full bg-gold-500" />
          </Link>
          <Link
            href="/"
            className="group ml-auto inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-ink-500 transition-colors hover:text-ink-900"
          >
            Retour à l’accueil
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10">
          <div className="w-full max-w-[430px] animate-fade-up">
            <div className="mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-600">
                Espace personnel
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.4rem,4vw,3.2rem)] font-light leading-[1.02] tracking-sharpest text-ink-950">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-ink-500">{subtitle}</p>
            </div>

            <div className="rounded-2xl border border-ink-900/[0.07] bg-white p-6 shadow-soft sm:p-8">
              {children}
            </div>

            <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>
          </div>
        </div>

        <footer className="px-5 pb-6 text-center text-[9px] uppercase tracking-widest text-ink-400 sm:px-10">
          ModelBénin · Données chiffrées · 18 ans et plus
        </footer>
      </section>
    </main>
  );
}
