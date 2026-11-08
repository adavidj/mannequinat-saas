import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  EyeIcon,
  LockIcon,
  ShieldIcon,
} from '@/shared/components/icons';
import { Magnetic, Reveal } from '@/shared/components/motion';
import { PageHero, PagePager } from '@/shared/components/PageHero';
import { SiteFooter } from '@/shared/components/SiteFooter';
import { SiteHeader } from '@/shared/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Talents',
  description:
    'Des visages, pas des algorithmes : une sélection éditoriale de la maison ModelBénin, dans le respect du consentement de chaque modèle.',
};

const TALENTS = [
  {
    name: 'Awa Dossou',
    city: 'Cotonou',
    level: 'Confirmée',
    field: 'Éditorial · Défilé',
    image: '/editorial/awa.jpg',
    tall: true,
  },
  {
    name: 'Fadila Bio Sanni',
    city: 'Porto-Novo',
    level: 'Débutante',
    field: 'Beauté · Campagne',
    image: '/editorial/fadila.jpg',
  },
  {
    name: 'Sessi Kpogli',
    city: 'Cotonou',
    level: 'Confirmé',
    field: 'Défilé · Podium',
    image: '/editorial/sessi.jpg',
    tall: true,
  },
  {
    name: 'Naomi Adjovi',
    city: 'Abomey-Calavi',
    level: 'Débutante',
    field: 'Éditorial · Beauté',
    image: '/editorial/naomi.jpg',
  },
  {
    name: 'Rodrigue Hounkpè',
    city: 'Parakou',
    level: 'Confirmé',
    field: 'Campagne · Sport',
    image: '/editorial/rodrigue.jpg',
  },
  {
    name: 'Mireille Agossou',
    city: 'Cotonou',
    level: 'Débutante',
    field: 'Éditorial · Beauté',
    image: '/editorial/mireille.jpg',
    tall: true,
  },
];

const ACCES = [
  {
    title: 'Une agence vérifiée',
    body: 'IFU ou RCCM contrôlé, charte signée. L’accès à la découverte n’est jamais anonyme.',
    icon: ShieldIcon,
  },
  {
    title: 'Une demande consentie',
    body: 'Le modèle autorise l’accès à son dossier complet. Sans accord, seuls les aperçus restent visibles.',
    icon: LockIcon,
  },
  {
    title: 'Un échange tracé',
    body: 'Chaque consultation et chaque message sont journalisés. Le modèle peut fermer l’accès à tout moment.',
    icon: EyeIcon,
  },
];

export default function TalentsPage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      <SiteHeader />

      <main id="contenu">
        <PageHero
          index="03"
          eyebrow="Les talents"
          title={
            <>
              Des visages,
              <br />
              pas des <span className="italic text-gradient-gold">algorithmes.</span>
            </>
          }
          intro={
            <p>
              Une sélection éditoriale de la maison. Les profils complets sont réservés aux agences
              vérifiées, avec le consentement explicite de chaque modèle.
            </p>
          }
          image="/editorial/awa.jpg"
          imageAlt="Portrait éditorial d’une modèle confirmée"
          note="Visuels d’illustration — les profils réels sont protégés et consentis"
        >
          <Magnetic>
            <Link
              href="/inscription"
              className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-gold-300 px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-ink-950 shadow-gold transition-colors duration-300 hover:bg-gold-200"
            >
              Rejoindre la sélection
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Magnetic>
        </PageHero>

        <section
          id="suite"
          className="relative scroll-mt-20 overflow-hidden bg-ivory-100 py-24 lg:py-32"
        >
          <div className="container-editorial">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <Reveal>
                  <p className="eyebrow">Sélection · Saison 01</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 max-w-xl font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                    Six visages,
                    <br />
                    six <span className="italic text-gold-700">présences.</span>
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={160}>
                <p className="max-w-sm text-sm leading-7 text-ink-600">
                  Chaque portrait est publié avec autorisation. Aucune image générée, aucun profil
                  fantôme : uniquement des personnes qui ont dit oui.
                </p>
              </Reveal>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {TALENTS.map((talent, index) => (
                <Reveal key={talent.name} delay={80 + (index % 3) * 90} className="h-full">
                  <article className="group flex h-full flex-col">
                    <div
                      className={`relative overflow-hidden bg-ink-200 ${
                        talent.tall ? 'aspect-[3/4]' : 'aspect-[4/5]'
                      }`}
                    >
                      <img
                        src={talent.image}
                        alt={`Portrait de ${talent.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover grayscale transition-all duration-[1.3s] ease-expo group-hover:scale-[1.05] group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/5 to-transparent" />
                      <span className="absolute left-4 top-4 font-mono text-[10px] tracking-widest text-ivory-50/70">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-ink-950/40 px-3 py-1 text-[9px] uppercase tracking-widest text-ivory-50 backdrop-blur">
                        {talent.level}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-5 text-ivory-50">
                        <p className="font-display text-2xl leading-none">{talent.name}</p>
                        <p className="mt-2 text-[9px] uppercase tracking-widest text-ivory-100/55">
                          {talent.city} · {talent.field}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-b border-ink-900/10 py-4">
                      <span className="text-[10px] uppercase tracking-widest text-ink-400">
                        Dossier sur autorisation
                      </span>
                      <ArrowUpRightIcon className="h-4 w-4 text-ink-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-gold-600" />
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <p className="mt-12 text-[10px] uppercase tracking-widest text-ink-400">
                Visuels d’illustration — les profils réels sont protégés et consentis.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-ink-950 to-ink-950 py-24 text-ivory-50 lg:py-32">
          <div className="grain pointer-events-none absolute inset-0 opacity-40" />
          <div className="container-editorial relative">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow text-gold-400">Rencontrer un talent</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                    Trois portes,
                    <br />
                    jamais <span className="italic text-gold-300">de raccourci.</span>
                  </h2>
                </Reveal>
                <Reveal delay={160}>
                  <p className="mt-7 max-w-sm text-sm leading-7 text-ivory-100/50">
                    La découverte est un privilège qui se mérite : une organisation réelle, une
                    demande claire, un consentement explicite.
                  </p>
                </Reveal>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <div className="divide-y divide-white/10 border-y border-white/10">
                  {ACCES.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Reveal key={item.title} delay={120 + index * 90}>
                        <div className="group flex gap-6 py-7 transition-colors duration-500 hover:bg-white/[0.03]">
                          <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/25 text-gold-300 transition-colors group-hover:border-gold-300/60">
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          <div>
                            <h3 className="font-display text-2xl font-light tracking-tight">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-ivory-100/55">{item.body}</p>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
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
              <p className="eyebrow">Vous êtes une agence</p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.8rem,6.4vw,5.8rem)] font-light leading-[0.92] tracking-sharpest">
                Découvrez les talents
                <br />
                de la <span className="italic text-gold-700">maison.</span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-ink-600">
                Créez un compte agence, présentez vos justificatifs, et accédez à la découverte
                encadrée.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic strength={8}>
                  <Link
                    href="/inscription"
                    className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-ink-950 px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-ivory-50 shadow-lift transition-colors duration-300 hover:bg-brand-900"
                  >
                    Créer un compte agence
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
                <Link
                  href="/confiance"
                  className="inline-flex items-center justify-center rounded-full border border-ink-900/15 px-8 py-4 text-[11px] font-semibold uppercase tracking-widest text-ink-800 transition-colors duration-300 hover:border-gold-500 hover:text-gold-700"
                >
                  Nos garanties
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <PagePager current="/talents" />
      </main>

      <SiteFooter />
    </div>
  );
}
