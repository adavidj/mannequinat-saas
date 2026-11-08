import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowRightIcon } from './icons';

type PageHeroProps = {
  index: string;
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  image: string;
  imageAlt: string;
  note?: string;
  children?: ReactNode;
};

/**
 * Ouverture éditoriale commune aux pages de la maison : fond d'encre, filet
 * d'or, titre monumental et portrait en cadre décalé. Les animations d'entrée
 * sont purement CSS, donc visibles dès la première peinture.
 */
export function PageHero({
  index,
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  note,
  children,
}: PageHeroProps) {
  return (
    <section className="grain relative isolate overflow-hidden bg-ink-950 text-ivory-50">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-44 top-1/4 h-[520px] w-[520px] rounded-full bg-brand-800/25 blur-[150px]" />
        <div className="absolute -right-28 bottom-[-12%] h-[580px] w-[580px] rounded-full bg-gold-700/20 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_35%,transparent_0%,rgba(10,10,9,0.4)_58%,rgba(10,10,9,0.9)_100%)]" />
      </div>

      <div className="container-editorial relative z-10 grid items-end gap-14 pb-20 pt-36 sm:pt-40 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-44">
        <div className="lg:col-span-7">
          <div className="flex animate-fade-up items-center gap-4">
            <span className="h-px w-10 bg-gold-400/70" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-300">
              {index} — {eyebrow}
            </p>
          </div>

          <h1
            className="mt-7 animate-fade-up font-display text-[clamp(2.9rem,7vw,6.4rem)] font-light leading-[0.92] tracking-sharpest"
            style={{ animationDelay: '120ms' }}
          >
            {title}
          </h1>

          <div
            className="mt-8 max-w-xl animate-fade-up text-[15px] leading-8 text-ivory-100/60"
            style={{ animationDelay: '240ms' }}
          >
            {intro}
          </div>

          {children ? (
            <div className="mt-10 animate-fade-up" style={{ animationDelay: '360ms' }}>
              {children}
            </div>
          ) : null}

          {note ? (
            <p
              className="mt-10 animate-fade-up text-[10px] uppercase tracking-widest text-ivory-100/35"
              style={{ animationDelay: '440ms' }}
            >
              {note}
            </p>
          ) : null}

          <div
            className="relative mt-12 animate-fade-up overflow-hidden bg-ink-900 lg:hidden"
            style={{ animationDelay: '320ms' }}
          >
            <img
              src={image}
              alt={imageAlt}
              className="aspect-[16/10] w-full object-cover grayscale-[30%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
          </div>
        </div>

        <div className="relative hidden lg:col-span-4 lg:col-start-9 lg:block">
          <div className="relative animate-fade-up" style={{ animationDelay: '260ms' }}>
            <div className="relative aspect-[3/4] overflow-hidden bg-ink-900 shadow-lift">
              <img
                src={image}
                alt={imageAlt}
                className="h-full w-full object-cover grayscale-[35%] contrast-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
              <span className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-widest text-ivory-50/60">
                ModelBénin · Éditorial
              </span>
            </div>
            <div className="pointer-events-none absolute -bottom-3 -left-3 -right-3 -top-3 border border-gold-400/25" />
            <div className="absolute -bottom-6 -right-6 hidden h-24 w-24 items-center justify-center rounded-full border border-gold-400/30 bg-ink-950/70 backdrop-blur-md xl:flex">
              <span className="font-display text-xl italic text-gold-300">MB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex justify-center pb-8">
        <a
          href="#suite"
          className="group inline-flex flex-col items-center gap-3 text-[8px] font-semibold uppercase tracking-widest text-ivory-100/35 transition-colors hover:text-gold-200"
        >
          Continuer
          <span className="relative h-9 w-px overflow-hidden bg-white/10">
            <span className="absolute inset-x-0 top-0 h-4 animate-[float_2.4s_ease-in-out_infinite] bg-gold-400" />
          </span>
        </a>
      </div>
    </section>
  );
}

type PageLink = { href: string; label: string; title: string };

const ORDER: PageLink[] = [
  { href: '/maison', label: 'La maison', title: 'Une maison, pas un annuaire.' },
  { href: '/parcours', label: 'Le parcours', title: 'De la première photo au premier contrat.' },
  { href: '/talents', label: 'Les talents', title: 'Des visages, pas des algorithmes.' },
  { href: '/confiance', label: 'La confiance', title: 'Elle se vérifie.' },
  { href: '/tarifs', label: 'Les tarifs', title: 'L’exigence a un prix. Jamais une promesse.' },
];

/** Navigation éditoriale de fin de page, entre les cinq chapitres publics. */
export function PagePager({ current }: { current: string }) {
  const position = ORDER.findIndex((page) => page.href === current);
  const previous = position > 0 ? ORDER[position - 1] : null;
  const next = position >= 0 && position < ORDER.length - 1 ? ORDER[position + 1] : null;

  return (
    <nav
      aria-label="Continuer la visite"
      className="border-t border-ink-900/10 bg-ivory-100 text-ink-900"
    >
      <div className="container-editorial grid gap-px sm:grid-cols-2">
        {[previous, next].map((page, index) => {
          if (!page) return <div key={index} className="hidden sm:block" aria-hidden="true" />;
          const isNext = index === 1;
          return (
            <Link
              key={page.href}
              href={page.href}
              className={`group relative flex flex-col justify-center gap-3 overflow-hidden py-10 transition-colors duration-500 hover:bg-white sm:px-8 ${
                isNext ? 'sm:items-end sm:text-right' : ''
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-600">
                {isNext ? 'Chapitre suivant' : 'Chapitre précédent'}
              </span>
              <span className="font-display text-2xl font-light leading-tight tracking-tight sm:text-3xl">
                {page.title}
              </span>
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-500 transition-colors group-hover:text-gold-700">
                {page.label}
                <ArrowRightIcon
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    isNext ? 'group-hover:translate-x-1' : 'rotate-180 group-hover:-translate-x-1'
                  }`}
                />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
