import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  LockIcon,
  StarIcon,
} from '@/shared/components/icons';
import { Magnetic, Marquee, Reveal } from '@/shared/components/motion';
import { PageHero, PagePager } from '@/shared/components/PageHero';
import { SiteFooter } from '@/shared/components/SiteFooter';
import { SiteHeader } from '@/shared/components/SiteHeader';

export const metadata: Metadata = {
  title: 'La maison',
  description:
    'ModelBénin est une maison de mannequinat numérique : rigueur éditoriale, preuves vérifiables et consentement de chaque modèle.',
};

const STATS = [
  { value: '18+', label: 'Accès strictement majeur' },
  { value: '03', label: 'Photos guidées obligatoires' },
  { value: '02', label: 'Niveaux de profil' },
  { value: '100%', label: 'Images modérées par un humain' },
];

const PRINCIPES = [
  {
    number: '01',
    title: 'Le regard humain',
    body: 'Chaque image est examinée avant publication. Aucun visage généré, aucun profil gonflé, aucune promesse invérifiable.',
    icon: StarIcon,
  },
  {
    number: '02',
    title: 'La preuve avant la promesse',
    body: 'Une agence présente son IFU ou son RCCM. Un profil confirmé présente une expérience contrôlée. Le reste est silence.',
    icon: CheckIcon,
  },
  {
    number: '03',
    title: 'Le consentement d’abord',
    body: 'Les débutants restent privés. Chaque consultation est journalisée et chaque modèle peut fermer son profil en un clic.',
    icon: LockIcon,
  },
];

export default function MaisonPage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      <SiteHeader />

      <main id="contenu">
        <PageHero
          index="01"
          eyebrow="La maison"
          title={
            <>
              Une maison,
              <br />
              pas un <span className="italic text-gradient-gold">annuaire.</span>
            </>
          }
          intro={
            <p>
              Nous croyons qu’un talent se révèle dans la rigueur : une lumière juste, un cadrage
              honnête, une réputation vérifiable. ModelBénin applique à la découverte ce que les
              maisons appliquent à leurs collections —{' '}
              <span className="italic text-gold-200">l’exigence.</span>
            </p>
          }
          image="/editorial/editorial-2.jpg"
          imageAlt="Portrait éditorial de la maison ModelBénin"
          note="Cotonou · Bénin — Maison de mannequinat numérique"
        >
          <Magnetic>
            <Link
              href="/parcours"
              className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-gold-300 px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-ink-950 shadow-gold transition-colors duration-300 hover:bg-gold-200"
            >
              Découvrir le parcours
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Magnetic>
        </PageHero>

        <div className="relative border-y border-white/10 bg-ink-950 py-4 text-ivory-50">
          <Marquee duration={48}>
            {['Rigueur', 'Consentement', 'Preuves', 'Éditorial', 'Cotonou', 'Exigence'].map(
              (word) => (
                <span key={word} className="flex items-center">
                  <span className="px-8 font-display text-xl font-light tracking-wide sm:text-2xl">
                    {word}
                  </span>
                  <span className="text-[9px] text-gold-400">✦</span>
                </span>
              ),
            )}
          </Marquee>
        </div>

        <section
          id="suite"
          className="relative scroll-mt-20 overflow-hidden bg-ivory-100 py-24 lg:py-32"
        >
          <div className="container-editorial grid gap-14 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow">Notre conviction</p>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                  La beauté passe.
                  <br />
                  La <span className="italic text-gold-700">méthode</span> reste.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-7 max-w-sm text-sm leading-7 text-ink-600">
                  Un site de casting classique collectionne des profils. Une maison construit des
                  carrières. La différence tient dans ce qu’on refuse de publier.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <div className="grid gap-px overflow-hidden border border-ink-900/10 bg-ink-900/10 sm:grid-cols-2">
                {STATS.map((stat, index) => (
                  <Reveal key={stat.label} delay={120 + index * 80}>
                    <div className="flex h-full flex-col justify-between gap-8 bg-ivory-100 p-7">
                      <p className="font-display text-5xl font-light tracking-tight text-ink-950">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-medium uppercase leading-relaxed tracking-widest text-ink-500">
                        {stat.label}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={260}>
                <figure className="group relative mt-12 overflow-hidden bg-ink-900">
                  <img
                    src="/editorial/editorial.jpg"
                    alt="Séance éditoriale ModelBénin"
                    className="aspect-[16/9] w-full object-cover grayscale-[30%] transition-transform duration-[1.6s] ease-expo group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 text-ivory-50">
                    <p className="max-w-xs font-display text-xl font-light italic leading-snug">
                      « L’élégance n’a pas besoin de bruit. »
                    </p>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-ivory-100/50">
                      Atelier · Cotonou
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-ink-950 to-ink-950 py-24 text-ivory-50 lg:py-32">
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute -left-40 top-10 h-[440px] w-[440px] rounded-full bg-brand-700/20 blur-[140px]" />
            <div className="absolute -right-24 bottom-0 h-[480px] w-[480px] rounded-full bg-gold-700/15 blur-[150px]" />
          </div>

          <div className="container-editorial relative">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <Reveal>
                  <p className="eyebrow text-gold-400">Ce qui nous distingue</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 max-w-2xl font-display text-[clamp(2.5rem,4.8vw,4.4rem)] font-light leading-[0.98] tracking-sharpest">
                    Trois principes,
                    <br />
                    <span className="italic text-gold-300">jamais négociés.</span>
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={160}>
                <p className="max-w-sm text-sm leading-7 text-ivory-100/50">
                  Ils coûtent plus cher, prennent plus de temps, et rendent la plateforme plus
                  petite. C’est exactement pour cela qu’ils restent.
                </p>
              </Reveal>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border-y border-white/10 bg-white/10 md:grid-cols-3">
              {PRINCIPES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={120 + index * 100} className="h-full">
                    <article className="group relative flex h-full flex-col gap-6 bg-ink-950 p-8 transition-colors duration-500 hover:bg-ink-900 sm:p-10">
                      <div className="flex items-start justify-between">
                        <span className="font-display text-5xl font-light leading-none text-gold-400/30 transition-colors duration-500 group-hover:text-gold-300">
                          {item.number}
                        </span>
                        <Icon className="h-5 w-5 text-gold-400/70" />
                      </div>
                      <h3 className="font-display text-2xl font-light tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-7 text-ivory-100/55">{item.body}</p>
                      <ArrowUpRightIcon className="mt-auto h-4 w-4 translate-y-1 text-gold-300 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-ivory-100 py-28 lg:py-36">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-display text-[24vw] font-light leading-none tracking-sharpest outline-wordmark"
          >
            MB
          </div>
          <div className="container-editorial relative text-center">
            <Reveal>
              <p className="eyebrow">Rejoindre la maison</p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.8rem,6.4vw,5.8rem)] font-light leading-[0.92] tracking-sharpest">
                Votre prochain chapitre
                <br />
                commence <span className="italic text-gold-700">ici.</span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic strength={8}>
                  <Link
                    href="/inscription"
                    className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-ink-950 px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-ivory-50 shadow-lift transition-colors duration-300 hover:bg-brand-900"
                  >
                    Créer mon profil
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
                <Link
                  href="/confiance"
                  className="inline-flex items-center justify-center rounded-full border border-ink-900/15 px-8 py-4 text-[11px] font-semibold uppercase tracking-widest text-ink-800 transition-colors duration-300 hover:border-gold-500 hover:text-gold-700"
                >
                  Lire la charte
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <PagePager current="/maison" />
      </main>

      <SiteFooter />
    </div>
  );
}
