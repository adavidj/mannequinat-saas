import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowRightIcon, CheckIcon, ChevronDownIcon } from '@/shared/components/icons';
import { Magnetic, Reveal } from '@/shared/components/motion';
import { PageHero, PagePager } from '@/shared/components/PageHero';
import { SiteFooter } from '@/shared/components/SiteFooter';
import { SiteHeader } from '@/shared/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Parcours',
  description:
    'De la première photo au premier contrat : les trois niveaux de ModelBénin, les preuves demandées et les garanties qui ne changent jamais.',
};

const ETAPES = [
  {
    number: '01',
    title: 'Débutant',
    subtitle: 'Entrer dans la maison',
    body: 'Trois photos guidées, sans filtre. Votre profil reste privé tant que la modération ne l’a pas validé, et aucune agence ne peut le consulter avant votre accord.',
    points: [
      'Portrait + pied face + pied profil',
      'Consentement explicite et révocable',
      'Aucune visibilité publique',
      'Revue humaine sous 72 heures',
    ],
    image: '/editorial/naomi.jpg',
  },
  {
    number: '02',
    title: 'Confirmé',
    subtitle: 'Faire reconnaître son expérience',
    body: 'Une expérience professionnelle vérifiée fait évoluer votre profil et élargit sa visibilité. Le badge confirmé atteste d’un parcours, jamais d’un paiement.',
    points: [
      'Preuves contrôlées par l’équipe',
      'Badge confirmé visible',
      'Portfolio enrichi et réordonnable',
      'Accès prioritaire aux castings',
    ],
    image: '/editorial/awa.jpg',
  },
  {
    number: '03',
    title: 'Agence vérifiée',
    subtitle: 'Travailler avec les professionnels',
    body: 'IFU ou RCCM contrôlés. Découverte encadrée, messagerie avec quotas anti-spam et signalement immédiat. Une agence qui sort du cadre perd son accès.',
    points: [
      'Organisation authentifiée',
      'Quotas anti-spam par jour',
      'Blocage en un clic',
      'Journal d’audit consultable',
    ],
    image: '/editorial/agency.jpg',
  },
];

const INVARIANTS = [
  {
    title: 'La gratuité du profil',
    body: 'Créer un profil, publier ses photos et être visible ne coûte rien. Les options payantes concernent les outils des agences, jamais l’accès des modèles.',
  },
  {
    title: 'Le consentement, à chaque étape',
    body: 'Chaque photo, chaque mise en relation et chaque consultation sont autorisées explicitement. Retirer son consentement ferme l’accès immédiatement.',
  },
  {
    title: 'La modération humaine',
    body: 'Un œil humain valide les images, les justificatifs et les signalements. Aucun classement automatique ne décide de la visibilité d’une personne.',
  },
];

const FAQ = [
  {
    question: 'Faut-il payer pour être visible ?',
    answer:
      'Non. Le profil, les photos guidées et la présentation aux agences vérifiées sont gratuits. Les abonnements concernent uniquement les outils de recherche des agences.',
  },
  {
    question: 'Qui peut voir mon profil quand je débute ?',
    answer:
      'Personne en dehors de l’équipe de modération. Votre profil reste privé jusqu’à validation, puis vous choisissez les agences autorisées à le consulter.',
  },
  {
    question: 'Combien de temps prend la validation ?',
    answer:
      'La revue humaine intervient sous 72 heures ouvrées. En cas de photo non conforme, vous recevez un motif précis et pouvez republier sans recommencer votre inscription.',
  },
  {
    question: 'Comment devenir confirmé ?',
    answer:
      'En présentant une expérience professionnelle vérifiable : contrat, attestation d’agence, publication ou référence contrôle. L’équipe vérifie la preuve, pas la notoriété.',
  },
];

export default function ParcoursPage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      <SiteHeader />

      <main id="contenu">
        <PageHero
          index="02"
          eyebrow="Le parcours"
          title={
            <>
              De la première photo
              <br />
              au <span className="italic text-gradient-gold">premier contrat.</span>
            </>
          }
          intro={
            <p>
              Un seul profil, deux niveaux de visibilité — puis la porte des agences vérifiées. La
              progression est documentée et ne dépend jamais d’un paiement.
            </p>
          }
          image="/editorial/naomi.jpg"
          imageAlt="Portrait d’une modèle débutante de la maison"
          note="Chaque étape est validée par un humain"
        >
          <Magnetic>
            <Link
              href="/inscription"
              className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-gold-300 px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-ink-950 shadow-gold transition-colors duration-300 hover:bg-gold-200"
            >
              Commencer mon profil
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
                  <p className="eyebrow">Trois étapes</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 max-w-xl font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                    Une progression
                    <br />
                    <span className="italic text-gold-700">lisible.</span>
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={160}>
                <p className="max-w-sm text-sm leading-7 text-ink-600">
                  Aucun palier ne s’achète. Chaque étape s’ouvre sur des preuves et se referme si le
                  cadre n’est plus respecté.
                </p>
              </Reveal>
            </div>

            <div className="mt-16 space-y-16 lg:space-y-24">
              {ETAPES.map((etape, index) => (
                <Reveal key={etape.title} delay={80}>
                  <article
                    className={`group grid items-center gap-10 lg:grid-cols-12 lg:gap-14 ${
                      index % 2 === 1 ? 'lg:[&>figure]:order-2' : ''
                    }`}
                  >
                    <div className="lg:col-span-5">
                      <div className="flex items-baseline gap-5">
                        <span className="font-display text-6xl font-light leading-none text-gold-500/60">
                          {etape.number}
                        </span>
                        <div>
                          <h3 className="font-display text-4xl font-light tracking-tight">
                            {etape.title}
                          </h3>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-gold-700">
                            {etape.subtitle}
                          </p>
                        </div>
                      </div>
                      <p className="mt-7 max-w-md text-sm leading-7 text-ink-600">{etape.body}</p>
                      <ul className="mt-8 grid gap-3 border-t border-ink-900/10 pt-7 sm:grid-cols-2">
                        {etape.points.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-3 text-[13px] leading-6 text-ink-700"
                          >
                            <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-600" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <figure className="relative lg:col-span-6 lg:col-start-7">
                      <div className="relative aspect-[4/3] overflow-hidden bg-ink-900 shadow-soft">
                        <img
                          src={etape.image}
                          alt={`Étape ${etape.number} — ${etape.title}`}
                          className="h-full w-full object-cover grayscale-[25%] transition-transform duration-[1.5s] ease-expo group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-ink-950/40 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-ivory-50 backdrop-blur">
                          Étape {etape.number}
                        </span>
                      </div>
                      <div className="pointer-events-none absolute -bottom-3 -left-3 -right-3 -top-3 border border-gold-500/20" />
                    </figure>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-ink-950 to-ink-950 py-24 text-ivory-50 lg:py-32">
          <div className="grain pointer-events-none absolute inset-0 opacity-40" />
          <div className="container-editorial relative">
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow text-gold-400">Invariants</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.2rem)] font-light leading-[0.98] tracking-sharpest">
                    Ce qui ne
                    <br />
                    change <span className="italic text-gold-300">jamais.</span>
                  </h2>
                </Reveal>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <div className="divide-y divide-white/10 border-y border-white/10">
                  {INVARIANTS.map((item, index) => (
                    <Reveal key={item.title} delay={120 + index * 90}>
                      <div className="grid gap-4 py-7 sm:grid-cols-[1fr_1.4fr] sm:gap-10">
                        <h3 className="font-display text-2xl font-light tracking-tight text-ivory-50">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-7 text-ivory-100/55">{item.body}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-ivory-100 py-24 lg:py-32">
          <div className="container-editorial grid gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow">Questions fréquentes</p>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="mt-6 font-display text-[clamp(2.3rem,4.2vw,3.8rem)] font-light leading-[0.98] tracking-sharpest">
                  Avant de
                  <br />
                  commencer.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <div className="divide-y divide-ink-900/10 border-y border-ink-900/10">
                {FAQ.map((item, index) => (
                  <Reveal key={item.question} delay={80 + index * 60}>
                    <details className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
                        <span className="text-sm font-semibold tracking-wide text-ink-900">
                          {item.question}
                        </span>
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-gold-600 transition-transform duration-500 group-open:rotate-180" />
                      </summary>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600">{item.answer}</p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <PagePager current="/parcours" />
      </main>

      <SiteFooter />
    </div>
  );
}
