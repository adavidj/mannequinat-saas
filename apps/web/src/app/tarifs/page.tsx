import type { Metadata } from 'next';
import Link from 'next/link';

import { PricingBoard } from '@/features/billing/components/PricingBoard';
import {
  ArrowRightIcon,
  CheckIcon,
  CreditCardIcon,
  EyeIcon,
  LockIcon,
  ReceiptIcon,
  ShieldIcon,
} from '@/shared/components/icons';
import { Magnetic, Reveal } from '@/shared/components/motion';
import { PageHero, PagePager } from '@/shared/components/PageHero';
import { SiteFooter } from '@/shared/components/SiteFooter';
import { SiteHeader } from '@/shared/components/SiteHeader';
import { formatFcfa } from '@/shared/lib/labels';
import { PLAN_ADDONS, PRICING_FAQ } from '@/shared/lib/plans';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Les formules ModelBénin : visibilité pour les modèles, outils de sélection pour les agences. Prix en francs CFA, sans engagement et sans promesse de contrat.',
};

const PRINCIPES = [
  {
    title: 'Jamais de contrat vendu',
    body: 'Un abonnement achète de la visibilité et des outils. Aucune formule ne promet un casting, un contrat ou un revenu. Cette frontière est non négociable.',
    icon: ShieldIcon,
  },
  {
    title: 'Un consentement, pas un accès',
    body: 'Le paiement d’une agence n’ouvre jamais un dossier sans l’accord du modèle. Le consentement reste gratuit, révocable et journalisé.',
    icon: LockIcon,
  },
  {
    title: 'Le strict nécessaire',
    body: 'Aucune coordonnée de paiement n’est stockée. Nous conservons la référence de transaction, le montant et le statut, pour votre facture et votre historique.',
    icon: EyeIcon,
  },
];

const INCLUS = [
  'Un profil gratuit et complet dès l’inscription',
  'Trois photos guidées modérées par un humain',
  'Une messagerie tracée et blocable',
  'La résiliation en un clic, sans frais cachés',
  'Une facture téléchargeable pour chaque paiement',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      <SiteHeader />

      <main id="contenu">
        <PageHero
          index="05"
          eyebrow="Tarifs"
          title={
            <>
              L’exigence a un prix.
              <br />
              Jamais une <span className="italic text-gradient-gold">promesse.</span>
            </>
          }
          intro={
            <p>
              Des formules lisibles, en francs CFA, sans engagement. Ce que vous payez, c’est du
              temps, de la visibilité et des outils — pas un contrat de mannequinat.
            </p>
          }
          image="/editorial/editorial-2.jpg"
          imageAlt="Silhouette éditoriale dans une lumière chaude"
          note="Tarifs de lancement — toute évolution sera annoncée avant application"
        >
          <Magnetic>
            <a
              href="#formules"
              className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-gold-300 px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-ink-950 shadow-gold transition-colors duration-300 hover:bg-gold-200"
            >
              Voir les formules
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Magnetic>
        </PageHero>

        <section
          id="formules"
          className="relative scroll-mt-24 overflow-hidden bg-ivory-100 py-24 lg:py-32"
        >
          <div className="container-editorial">
            <div className="mx-auto max-w-2xl text-center">
              <Reveal>
                <p className="eyebrow">Formules · Saison 01</p>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                  Choisissez ce qui vous
                  <br />
                  fait <span className="italic text-gold-700">avancer.</span>
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 text-sm leading-7 text-ink-600">
                  Chaque formule commence par un profil gratuit. Vous ajoutez ensuite le niveau de
                  visibilité ou d’outils dont vous avez besoin, et vous pouvez revenir en arrière à
                  tout moment.
                </p>
              </Reveal>
            </div>

            <div className="mt-16">
              <PricingBoard />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-ink-950 to-ink-950 py-24 text-ivory-50 lg:py-32">
          <div className="grain pointer-events-none absolute inset-0 opacity-40" />
          <div className="container-editorial relative">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow text-gold-400">Notre ligne rouge</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                    Ce que l’argent
                    <br />
                    n’achète <span className="italic text-gold-300">pas.</span>
                  </h2>
                </Reveal>
                <Reveal delay={160}>
                  <p className="mt-7 max-w-sm text-sm leading-7 text-ivory-100/50">
                    Une plateforme de mannequinat doit dire ce qu’elle ne vend pas. Trois limites
                    structurent chaque ligne de notre grille.
                  </p>
                </Reveal>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <div className="divide-y divide-white/10 border-y border-white/10">
                  {PRINCIPES.map((item, index) => {
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

        <section className="relative overflow-hidden bg-ivory-100 py-24 lg:py-32">
          <div className="container-editorial">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <Reveal>
                  <p className="eyebrow">Options à la carte</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                    Pas besoin d’un
                    <br />
                    abonnement pour <span className="italic text-gold-700">un besoin.</span>
                  </h2>
                </Reveal>
                <Reveal delay={160}>
                  <p className="mt-7 max-w-sm text-sm leading-7 text-ink-600">
                    Le badge vérifié, le boost de sept jours et le casting à l’unité sont des achats
                    ponctuels. Ils seront ouverts après validation de l’intégration Mobile Money.
                  </p>
                </Reveal>
                <Reveal delay={220}>
                  <div className="mt-9 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <CreditCardIcon className="h-4 w-4 shrink-0" />
                    Ouverture prochaine — les formules restent la priorité.
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-6 lg:col-start-7">
                <div className="grid gap-4">
                  {PLAN_ADDONS.map((addon, index) => (
                    <Reveal key={addon.name} delay={100 + index * 80}>
                      <article className="group flex flex-col gap-4 border border-ink-900/10 bg-white p-6 transition-colors duration-500 hover:border-gold-500/50 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-2xl font-light tracking-tight">
                              {addon.name}
                            </h3>
                            <span className="rounded-full bg-ink-900/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-ink-500">
                              Bientôt
                            </span>
                          </div>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
                            {addon.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="font-display text-3xl font-light leading-none">
                            {formatFcfa(addon.priceFcfa)}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-400">
                            {addon.unit}
                          </p>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-ink-900/10 bg-white/60 py-24 lg:py-32">
          <div className="container-editorial">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <Reveal>
                  <p className="eyebrow">Toujours inclus</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 font-display text-[clamp(2.3rem,4vw,3.6rem)] font-light leading-[1] tracking-sharpest">
                    Le gratuit reste
                    <br />
                    un vrai <span className="italic text-gold-700">départ.</span>
                  </h2>
                </Reveal>
                <Reveal delay={160}>
                  <ul className="mt-9 space-y-4">
                    {INCLUS.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm leading-6 text-ink-600"
                      >
                        <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-gold-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>

              <div className="lg:col-span-6 lg:col-start-7">
                <Reveal>
                  <p className="eyebrow">Questions fréquentes</p>
                </Reveal>
                <Reveal delay={90}>
                  <div className="mt-6 divide-y divide-ink-900/10 border-y border-ink-900/10">
                    {PRICING_FAQ.map((item) => (
                      <details key={item.question} className="group py-5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-display text-xl font-light tracking-tight text-ink-900 transition-colors marker:content-none hover:text-gold-700">
                          {item.question}
                          <span className="relative mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-900/15 text-ink-500 transition-transform duration-300 group-open:rotate-45">
                            <span className="absolute h-px w-2.5 bg-current" />
                            <span className="absolute h-2.5 w-px bg-current" />
                          </span>
                        </summary>
                        <p className="mt-3 max-w-xl pb-1 text-sm leading-7 text-ink-500">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </Reveal>
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
              <p className="eyebrow">Commencer sans payer</p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.8rem,6.4vw,5.8rem)] font-light leading-[0.92] tracking-sharpest">
                Votre profil d’abord.
                <br />
                La formule <span className="italic text-gold-700">ensuite.</span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-ink-600">
                Créez votre profil gratuitement, ajoutez vos trois photos guidées, et décidez plus
                tard si un abonnement vous apporte quelque chose.
              </p>
            </Reveal>
            <Reveal delay={280}>
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
                  href="/connexion?next=%2Fdashboard%2Fabonnement"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-900/15 px-8 py-4 text-[11px] font-semibold uppercase tracking-widest text-ink-800 transition-colors duration-300 hover:border-gold-500 hover:text-gold-700"
                >
                  <ReceiptIcon className="h-4 w-4" />
                  Gérer mon abonnement
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <PagePager current="/tarifs" />
      </main>

      <SiteFooter />
    </div>
  );
}
