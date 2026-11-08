import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  EyeIcon,
  FlagIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  StarIcon,
} from '@/shared/components/icons';
import { Magnetic, Reveal } from '@/shared/components/motion';
import { PageHero, PagePager } from '@/shared/components/PageHero';
import { SiteFooter } from '@/shared/components/SiteFooter';
import { SiteHeader } from '@/shared/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Confiance',
  description:
    'La confiance ne se déclare pas, elle se vérifie : modération humaine, stockage privé, journal d’audit et signalement accessible.',
};

const GARANTIES = [
  {
    title: 'Modération humaine',
    body: 'Chaque photo est examinée avant publication. Aucune image générée n’est acceptée.',
    icon: StarIcon,
  },
  {
    title: 'Stockage privé',
    body: 'URLs signées de courte durée. Vos fichiers ne sont jamais exposés publiquement.',
    icon: LockIcon,
  },
  {
    title: 'Journal d’audit',
    body: 'Chaque consultation de profil est tracée, pour vous comme pour nous.',
    icon: EyeIcon,
  },
  {
    title: 'Signalement & blocage',
    body: 'Un canal dédié, une réponse humaine, et la possibilité de bloquer une agence.',
    icon: FlagIcon,
  },
  {
    title: '18 ans et plus',
    body: 'Contrôle à l’inscription et à chaque mise à jour du profil.',
    icon: ShieldIcon,
  },
  {
    title: 'Données sensibles',
    body: 'Date de naissance et mensurations chiffrées au repos, accès restreint.',
    icon: LockIcon,
  },
];

const CHARTE = [
  {
    number: '01',
    title: 'Aucun argent contre un contrat',
    body: 'Il est interdit de demander ou de proposer de l’argent en échange d’une opportunité. Tout signalement est traité comme un cas grave.',
  },
  {
    number: '02',
    title: 'Aucune image sans accord',
    body: 'Un modèle peut retirer une photo à tout moment. Le retrait est effectif immédiatement, y compris dans les caches et les liens signés.',
  },
  {
    number: '03',
    title: 'Aucune pression, aucun harcèlement',
    body: 'Les agences disposent de quotas stricts. Un comportement insistants entraîne une suspension, puis une exclusion définitive.',
  },
  {
    number: '04',
    title: 'Aucun profil fantôme',
    body: 'Chaque compte est rattaché à une personne ou à une organisation vérifiable. Les doublons et les usurpations sont supprimés.',
  },
];

const SIGNALER = [
  'Décrivez les faits, la date et le compte concerné.',
  'Joignez les captures ou références utiles.',
  'Nous accusons réception sous 24 heures ouvrées.',
  'La mesure conservatoire est prise avant l’analyse complète.',
];

export default function ConfiancePage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      <SiteHeader />

      <main id="contenu">
        <PageHero
          index="04"
          eyebrow="La confiance"
          title={
            <>
              La confiance ne se
              <br />
              déclare pas.
              <br />
              Elle se <span className="italic text-gradient-gold">vérifie.</span>
            </>
          }
          intro={
            <p>
              Modération humaine, stockage privé, journal d’audit et signalement accessible : la
              sécurité n’est pas une promesse marketing, c’est une chaîne de contrôles.
            </p>
          }
          image="/editorial/agency.jpg"
          imageAlt="Séance de travail avec une agence vérifiée"
          note="Charte opposable à tous les comptes, sans exception"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Magnetic>
              <a
                href="#signaler"
                className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-gold-300 px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-ink-950 shadow-gold transition-colors duration-300 hover:bg-gold-200"
              >
                Signaler un abus
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </Magnetic>
            <Link
              href="/confidentialite"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-[11px] font-semibold uppercase tracking-widest text-ivory-100/80 transition-colors duration-300 hover:border-gold-300/70 hover:text-gold-200"
            >
              Politique de confidentialité
            </Link>
          </div>
        </PageHero>

        <section
          id="suite"
          className="relative scroll-mt-20 overflow-hidden bg-ivory-100 py-24 lg:py-32"
        >
          <div className="container-editorial">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <Reveal>
                  <p className="eyebrow">Nos garanties</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 max-w-xl font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                    Six contrôles,
                    <br />à chaque <span className="italic text-gold-700">instant.</span>
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={160}>
                <p className="max-w-sm text-sm leading-7 text-ink-600">
                  Chaque garantie correspond à un mécanisme technique ou humain vérifiable, pas à
                  une intention.
                </p>
              </Reveal>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border border-ink-900/10 bg-ink-900/10 sm:grid-cols-2 lg:grid-cols-3">
              {GARANTIES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={80 + (index % 3) * 80} className="h-full">
                    <div className="group h-full bg-ivory-100 p-7 transition-colors duration-500 hover:bg-white sm:p-8">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold-600/25 text-gold-700 transition-colors duration-500 group-hover:border-gold-600/60">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <h3 className="mt-6 text-sm font-semibold tracking-wide text-ink-900">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-6 text-ink-500">{item.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-ink-950 to-ink-950 py-24 text-ivory-50 lg:py-32">
          <div className="grain pointer-events-none absolute inset-0 opacity-40" />
          <div className="container-editorial relative grid gap-14 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow text-gold-400">La charte</p>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                  Quatre règles,
                  <br />
                  <span className="italic text-gold-300">opposables.</span>
                </h2>
              </Reveal>
              <Reveal delay={180}>
                <blockquote className="mt-10 max-w-md border-l border-gold-400/40 pl-6">
                  <p className="font-display text-xl font-light italic leading-relaxed text-ivory-100/75">
                    « Un profil n’est pas une vitrine. C’est une personne, avec ses images, ses
                    limites et son consentement. »
                  </p>
                  <footer className="mt-4 text-[10px] uppercase tracking-widest text-ivory-100/40">
                    La charte ModelBénin
                  </footer>
                </blockquote>
              </Reveal>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <div className="divide-y divide-white/10 border-y border-white/10">
                {CHARTE.map((item, index) => (
                  <Reveal key={item.number} delay={100 + index * 80}>
                    <div className="group flex gap-6 py-7 transition-colors duration-500 hover:bg-white/[0.03]">
                      <span className="font-display text-4xl font-light leading-none text-gold-400/35 transition-colors group-hover:text-gold-300">
                        {item.number}
                      </span>
                      <div>
                        <h3 className="font-display text-2xl font-light tracking-tight">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-ivory-100/55">{item.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="signaler" className="scroll-mt-24 bg-ivory-100 py-24 lg:py-32">
          <div className="container-editorial grid gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="eyebrow">Signalement</p>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="mt-6 font-display text-[clamp(2.4rem,4.4vw,4rem)] font-light leading-[0.98] tracking-sharpest">
                  Une alerte
                  <br />
                  n’est jamais
                  <br />
                  <span className="italic text-gold-700">ignorée.</span>
                </h2>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-7 max-w-md text-sm leading-7 text-ink-600">
                  Si vous êtes témoin ou victime d’un comportement contraire à la charte,
                  écrivez-nous. Chaque signalement est lu par une personne, pas par un automate.
                </p>
              </Reveal>
              <Reveal delay={260}>
                <a
                  href="mailto:signalement@modelbenin.bj"
                  className="group mt-9 inline-flex items-center gap-3 rounded-full bg-ink-950 px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-ivory-50 transition-colors duration-300 hover:bg-brand-900"
                >
                  <MailIcon className="h-4 w-4 text-gold-300" />
                  signalement@modelbenin.bj
                  <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                </a>
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={120}>
                <ol className="space-y-6 border-l border-ink-900/10 pl-7">
                  {SIGNALER.map((step, index) => (
                    <li key={step} className="relative">
                      <span className="absolute -left-[38px] flex h-6 w-6 items-center justify-center rounded-full border border-gold-600/30 bg-ivory-100 text-[10px] font-semibold text-gold-700">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-ink-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
              <Reveal delay={220}>
                <div className="mt-10 flex items-start gap-4 border border-ink-900/10 bg-white p-6">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  <p className="text-[13px] leading-6 text-ink-600">
                    En cas de danger immédiat, contactez les autorités locales. ModelBénin coopère
                    avec les réquisitions judiciaires, dans le respect du secret des données.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <PagePager current="/confiance" />
      </main>

      <SiteFooter />
    </div>
  );
}
