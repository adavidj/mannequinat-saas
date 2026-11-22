import type { Metadata } from 'next';
import Link from 'next/link';

import { HeroCanvas } from '@/shared/components/HeroCanvas';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  LockIcon,
  StarIcon,
} from '@/shared/components/icons';
import { Magnetic, Marquee, Reveal, Tilt } from '@/shared/components/motion';
import { SiteFooter } from '@/shared/components/SiteFooter';
import { SiteHeader } from '@/shared/components/SiteHeader';

export const metadata: Metadata = {
  title: 'La maison du mannequinat béninois',
  description:
    'ModelBénin relie les modèles du Bénin aux agences vérifiées : profils modérés, visibilité par paliers, messagerie encadrée.',
};

const IMAGES = {
  heroMain: '/editorial/editorial.jpg',
  heroSecond: '/editorial/editorial-2.jpg',
  parcoursDebutant: '/editorial/naomi.jpg',
  parcoursConfirme: '/editorial/awa.jpg',
  parcoursAgence: '/editorial/agency.jpg',
};

const TALENTS = [
  {
    name: 'Awa Dossou',
    city: 'Cotonou',
    level: 'Confirmée',
    image: '/editorial/awa.jpg',
  },
  {
    name: 'Fadila Bio Sanni',
    city: 'Porto-Novo',
    level: 'Débutante',
    image: '/editorial/fadila.jpg',
  },
  {
    name: 'Sessi Kpogli',
    city: 'Cotonou',
    level: 'Confirmé',
    image: '/editorial/sessi.jpg',
  },
  {
    name: 'Naomi Adjovi',
    city: 'Abomey-Calavi',
    level: 'Débutante',
    image: '/editorial/naomi.jpg',
  },
  {
    name: 'Rodrigue Hounkpè',
    city: 'Parakou',
    level: 'Confirmé',
    image: '/editorial/rodrigue.jpg',
  },
  {
    name: 'Mireille Agossou',
    city: 'Cotonou',
    level: 'Débutante',
    image: '/editorial/mireille.jpg',
  },
];

const PARCOURS = [
  {
    number: '01',
    title: 'Débutant',
    body: 'Trois photos guidées, sans filtre. Votre profil reste privé tant que la modération ne l’a pas validé.',
    points: [
      'Portrait + pied face + pied profil',
      'Consentement explicite',
      'Aucune visibilité publique',
    ],
    image: IMAGES.parcoursDebutant,
  },
  {
    number: '02',
    title: 'Confirmé',
    body: 'Une expérience professionnelle vérifiée fait évoluer votre profil et élargit sa visibilité.',
    points: ['Preuves contrôlées par l’équipe', 'Badge confirmé visible', 'Portfolio enrichi'],
    image: IMAGES.parcoursConfirme,
  },
  {
    number: '03',
    title: 'Agence vérifiée',
    body: 'IFU ou RCCM contrôlés. Découverte, messagerie encadrée et signalement immédiat.',
    points: ['Organisation authentifiée', 'Quotas anti-spam', 'Blocage en un clic'],
    image: IMAGES.parcoursAgence,
  },
];

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
    icon: CheckIcon,
  },
  {
    title: 'Signalement & blocage',
    body: 'Un canal dédié, une réponse humaine, et la possibilité de bloquer une agence.',
    icon: ArrowUpRightIcon,
  },
  {
    title: '18 ans et plus',
    body: 'Contrôle à l’inscription et à chaque mise à jour du profil.',
    icon: StarIcon,
  },
  {
    title: 'Données sensibles',
    body: 'Date de naissance et mensurations chiffrées au repos, accès restreint.',
    icon: LockIcon,
  },
];

const STATS = [
  { value: '18+', label: 'Accès strictement majeur' },
  { value: '03', label: 'Photos guidées obligatoires' },
  { value: '02', label: 'Niveaux de profil' },
  { value: '100%', label: 'Images modérées par un humain' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      <SiteHeader />

      <main id="contenu">
        {/* ————————————————————————— HERO ————————————————————————— */}
        <section className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink-950 text-ivory-50">
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-48 top-1/3 h-[620px] w-[620px] rounded-full bg-brand-800/25 blur-[150px]" />
            <div className="absolute -right-24 bottom-[-10%] h-[680px] w-[680px] rounded-full bg-gold-700/20 blur-[170px]" />
            <HeroCanvas className="absolute inset-y-0 right-0 hidden w-[60%] lg:block" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,transparent_0%,rgba(10,10,9,0.35)_55%,rgba(10,10,9,0.85)_100%)]" />
          </div>

          <div className="container-editorial relative z-10 grid items-center gap-16 pb-28 pt-32 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-28">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="h-px w-10 bg-gold-400/70" />
                <p className="animate-fade-up text-[10px] font-semibold uppercase tracking-widest text-gold-300">
                  Cotonou · Bénin — Maison de mannequinat
                </p>
              </div>

              <h1 className="mt-7 font-display text-[clamp(3.4rem,9vw,8.6rem)] font-light leading-[0.88] tracking-sharpest">
                <span className="block overflow-hidden">
                  <span className="block animate-rise" style={{ animationDelay: '80ms' }}>
                    L’élégance
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span
                    className="block animate-rise italic text-gradient-gold"
                    style={{ animationDelay: '220ms' }}
                  >
                    béninoise,
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span className="block animate-rise" style={{ animationDelay: '360ms' }}>
                    révélée.
                  </span>
                </span>
              </h1>

              <p
                className="mt-9 max-w-lg animate-fade-up text-[15px] leading-8 text-ivory-100/60"
                style={{ animationDelay: '620ms' }}
              >
                La première maison numérique qui relie les modèles du Bénin aux agences réellement
                vérifiées. Un profil, deux niveaux, et un œil humain sur chaque image.
              </p>

              <div
                className="mt-10 flex animate-fade-up flex-col gap-3 sm:flex-row sm:items-center"
                style={{ animationDelay: '760ms' }}
              >
                <Magnetic>
                  <Link
                    href="/inscription"
                    className="btn-shine group inline-flex items-center justify-center gap-3 rounded-full bg-gold-300 px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-ink-950 shadow-gold transition-colors duration-300 hover:bg-gold-200"
                  >
                    Créer mon profil
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
                <Link
                  href="/maison"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-[11px] font-semibold uppercase tracking-widest text-ivory-100/80 transition-colors duration-300 hover:border-gold-300/70 hover:text-gold-200"
                >
                  Découvrir la maison
                </Link>
              </div>

              <div
                className="mt-12 flex animate-fade-up flex-wrap items-center gap-x-7 gap-y-3 text-[9px] font-semibold uppercase tracking-widest text-ivory-100/40"
                style={{ animationDelay: '900ms' }}
              >
                {['18 ans et plus', 'Photos modérées', 'Données chiffrées'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-gold-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Pile de portraits — version mobile */}
            <div className="mt-2 grid grid-cols-5 gap-3 sm:hidden">
              <div className="col-span-3 overflow-hidden bg-ink-900">
                <img
                  src={IMAGES.heroMain}
                  alt="Portrait éditorial d’une modèle béninoise"
                  className="aspect-[3/4] h-full w-full object-cover grayscale-[25%]"
                />
              </div>
              <div className="col-span-2 mt-10 overflow-hidden bg-ink-900">
                <img
                  src={IMAGES.heroSecond}
                  alt="Second portrait d’exemple"
                  className="aspect-[3/4] h-full w-full object-cover grayscale-[40%]"
                />
              </div>
            </div>

            {/* Pile de portraits en perspective */}
            <div className="relative mx-auto hidden h-[540px] w-full max-w-[500px] perspective-hero sm:block lg:col-span-5 lg:h-[600px]">
              <Tilt max={10} className="absolute inset-0">
                <div className="absolute right-0 top-0 w-[70%]">
                  <div className="group relative aspect-[3/4] overflow-hidden bg-ink-900 shadow-lift">
                    <img
                      src={IMAGES.heroMain}
                      alt="Portrait éditorial d’une modèle béninoise"
                      className="h-full w-full object-cover grayscale-[30%] contrast-[1.05] transition-transform duration-[1.4s] ease-expo group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="font-display text-2xl leading-none">Awa Dossou</p>
                      <p className="mt-2 text-[9px] uppercase tracking-widest text-ivory-100/55">
                        Cotonou · Exemple illustratif
                      </p>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -bottom-3 -left-3 -right-3 -top-3 border border-gold-400/25" />
                </div>

                <div className="absolute bottom-2 left-0 w-[52%] animate-float">
                  <div className="group relative aspect-[4/5] overflow-hidden bg-ink-900 shadow-lift">
                    <img
                      src={IMAGES.heroSecond}
                      alt="Second portrait d’exemple"
                      className="h-full w-full object-cover grayscale-[45%] transition duration-[1.4s] ease-expo group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-ink-950/50 px-3 py-1 text-[8px] font-semibold uppercase tracking-widest backdrop-blur">
                      Exemple
                    </span>
                  </div>
                </div>
              </Tilt>

              <div className="absolute -bottom-2 right-2 flex h-28 w-28 items-center justify-center rounded-full border border-gold-400/30 bg-ink-950/70 backdrop-blur-md">
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 h-full w-full animate-spin-slow"
                >
                  <defs>
                    <path id="hero-circle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
                  </defs>
                  <text fill="#e4c78d" fontSize="6.2" letterSpacing="3.1" className="uppercase">
                    <textPath href="#hero-circle">ModelBénin · Cotonou · Bénin ·</textPath>
                  </text>
                </svg>
                <span className="font-display text-2xl italic text-gold-300">MB</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-7 hidden justify-center lg:flex">
            <span className="flex flex-col items-center gap-3 text-[8px] font-semibold uppercase tracking-widest text-ivory-100/35">
              Défiler
              <span className="relative h-10 w-px overflow-hidden bg-white/10">
                <span className="absolute inset-x-0 top-0 h-4 animate-[float_2.4s_ease-in-out_infinite] bg-gold-400" />
              </span>
            </span>
          </div>
        </section>

        {/* ————————————————————————— MARQUEE ————————————————————————— */}
        <div className="relative border-y border-white/10 bg-ink-950 py-5 text-ivory-50">
          <Marquee duration={44}>
            {['Mode', 'Beauté', 'Défilé', 'Éditorial', 'Campagnes', 'Podium'].map((word) => (
              <span key={word} className="flex items-center">
                <span className="px-8 font-display text-2xl font-light tracking-wide sm:text-3xl">
                  {word}
                </span>
                <span className="text-[10px] text-gold-400">✦</span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* ————————————————————————— LA MAISON ————————————————————————— */}
        <section id="maison" className="relative overflow-hidden bg-ivory-100 py-24 lg:py-32">
          <div className="container-editorial">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow">01 — La maison</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 font-display text-[clamp(2.6rem,5vw,4.4rem)] font-light leading-[0.98] tracking-sharpest">
                    Une maison,
                    <br />
                    pas un annuaire.
                  </h2>
                </Reveal>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <Reveal delay={120}>
                  <p className="font-display text-2xl font-light leading-snug text-ink-800 sm:text-[28px]">
                    Nous croyons qu’un talent se révèle dans la rigueur : une lumière juste, un
                    cadrage honnête, une réputation vérifiable. ModelBénin applique à la découverte
                    ce que les maisons appliquent à leurs collections —{' '}
                    <span className="italic text-gold-700">l’exigence.</span>
                  </p>
                </Reveal>
                <Reveal delay={200}>
                  <p className="mt-7 max-w-xl text-sm leading-7 text-ink-600">
                    Ici, pas de profils gonflés ni de promesses invisibles. Les débutants restent
                    privés jusqu’à validation de leurs trois photos guidées ; les agences prouvent
                    leur existence avec un IFU ou un RCCM ; chaque accès est journalisé.
                  </p>
                </Reveal>

                <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink-900/10 pt-9 sm:grid-cols-4">
                  {STATS.map((stat, index) => (
                    <Reveal key={stat.label} delay={260 + index * 70}>
                      <p className="font-display text-4xl font-light tracking-tight text-ink-950">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-[10px] font-medium uppercase leading-relaxed tracking-widest text-ink-500">
                        {stat.label}
                      </p>
                    </Reveal>
                  ))}
                </div>

                <Reveal delay={320}>
                  <Link
                    href="/maison"
                    className="group mt-10 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-ink-800 transition-colors duration-300 hover:text-gold-700"
                  >
                    Lire le manifeste
                    <span className="relative h-px w-12 overflow-hidden bg-ink-900/20">
                      <span className="absolute inset-0 origin-left scale-x-0 bg-gold-500 transition-transform duration-500 ease-expo group-hover:scale-x-100" />
                    </span>
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ————————————————————————— PARCOURS ————————————————————————— */}
        <section
          id="parcours"
          className="relative overflow-hidden bg-ink-950 py-24 text-ivory-50 lg:py-32"
        >
          <div className="grain pointer-events-none absolute inset-0 opacity-40" />
          <div className="container-editorial relative">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <Reveal>
                  <p className="eyebrow">02 — Le parcours</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 max-w-2xl font-display text-[clamp(2.6rem,5vw,4.6rem)] font-light leading-[0.98] tracking-sharpest">
                    De la première photo
                    <br />
                    au <span className="italic text-gold-300">premier contrat.</span>
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={180}>
                <p className="max-w-sm text-sm leading-7 text-ivory-100/50">
                  Un seul profil, deux niveaux. La progression est visible, documentée, et ne dépend
                  jamais d’un paiement.
                </p>
              </Reveal>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden border-y border-white/10 bg-white/10 md:grid-cols-3">
              {PARCOURS.map((item, index) => (
                <Reveal key={item.title} delay={120 + index * 110} className="h-full">
                  <article className="group relative flex h-full flex-col overflow-hidden bg-ink-950 p-7 transition-colors duration-500 hover:bg-ink-900 sm:p-9">
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover opacity-20 grayscale"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/20" />
                    </div>

                    <div className="relative flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <span className="font-display text-6xl font-light leading-none text-gold-400/35 transition-colors duration-500 group-hover:text-gold-300">
                          {item.number}
                        </span>
                        <ArrowUpRightIcon className="h-5 w-5 -translate-y-1 text-gold-300 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
                      </div>
                      <h3 className="mt-10 font-display text-3xl font-light tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-ivory-100/55">{item.body}</p>
                      <ul className="mt-7 space-y-3 border-t border-white/10 pt-6">
                        {item.points.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-3 text-[13px] text-ivory-100/70"
                          >
                            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={420}>
              <Link
                href="/parcours"
                className="group mt-10 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-ivory-100/70 transition-colors duration-300 hover:text-gold-200"
              >
                Explorer les trois niveaux
                <span className="relative h-px w-12 overflow-hidden bg-white/20">
                  <span className="absolute inset-0 origin-left scale-x-0 bg-gold-400 transition-transform duration-500 ease-expo group-hover:scale-x-100" />
                </span>
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ————————————————————————— TALENTS ————————————————————————— */}
        <section id="talents" className="relative overflow-hidden bg-ivory-100 py-24 lg:py-32">
          <div className="container-editorial">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <Reveal>
                  <p className="eyebrow">03 — Talents</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-6 font-display text-[clamp(2.6rem,5vw,4.4rem)] font-light leading-[0.98] tracking-sharpest">
                    Des visages,
                    <br />
                    pas des <span className="italic text-gold-700">algorithmes.</span>
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={160}>
                <p className="max-w-sm text-sm leading-7 text-ink-600">
                  Exemples illustratifs de présentation. Les profils réels sont réservés aux agences
                  vérifiées, dans le respect du consentement de chaque modèle.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="mt-14">
            <Marquee duration={62} className="mask-fade-x">
              {TALENTS.map((talent, index) => (
                <article
                  key={talent.name}
                  className="group relative mr-4 w-[230px] shrink-0 sm:mr-5 sm:w-[270px]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-ink-200">
                    <img
                      src={talent.image}
                      alt={`Portrait de ${talent.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover grayscale transition-all duration-[1.2s] ease-expo group-hover:scale-[1.05] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/5 to-transparent" />
                    <span className="absolute left-4 top-4 font-mono text-[10px] tracking-widest text-ivory-50/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-5 text-ivory-50">
                      <p className="font-display text-2xl leading-none">{talent.name}</p>
                      <p className="mt-2 text-[9px] uppercase tracking-widest text-ivory-100/55">
                        {talent.city} · {talent.level}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </Marquee>
          </div>

          <div className="container-editorial mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] uppercase tracking-widest text-ink-400">
              Exemples illustratifs — aucun de ces profils n’est inscrit sur la plateforme.
            </p>
            <Link
              href="/talents"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-ink-800 transition-colors duration-300 hover:text-gold-700"
            >
              Voir les exemples
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* ————————————————————————— CONFIANCE ————————————————————————— */}
        <section
          id="confiance"
          className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-ink-950 to-ink-950 py-24 text-ivory-50 lg:py-32"
        >
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute -left-40 top-10 h-[460px] w-[460px] rounded-full bg-brand-700/20 blur-[140px]" />
            <div className="absolute -right-32 bottom-0 h-[520px] w-[520px] rounded-full bg-gold-700/15 blur-[150px]" />
          </div>

          <div className="container-editorial relative grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <Reveal>
                <p className="eyebrow">04 — Confiance</p>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="mt-6 font-display text-[clamp(2.6rem,5vw,4.6rem)] font-light leading-[0.98] tracking-sharpest">
                  La confiance ne se
                  <br />
                  déclare pas.
                  <br />
                  Elle se <span className="italic text-gold-300">vérifie.</span>
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

            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {GARANTIES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={100 + index * 70}>
                    <div className="group h-full bg-ink-950/80 p-6 transition-colors duration-500 hover:bg-ink-900/80 sm:p-7">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/25 text-gold-300 transition-colors duration-500 group-hover:border-gold-300/60 group-hover:text-gold-200">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <h3 className="mt-5 text-sm font-semibold tracking-wide text-ivory-50">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-6 text-ivory-100/50">{item.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={520}>
              <Link
                href="/confiance"
                className="group mt-10 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-ivory-100/70 transition-colors duration-300 hover:text-gold-200"
              >
                Lire la charte complète
                <span className="relative h-px w-12 overflow-hidden bg-white/20">
                  <span className="absolute inset-0 origin-left scale-x-0 bg-gold-400 transition-transform duration-500 ease-expo group-hover:scale-x-100" />
                </span>
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ————————————————————————— CTA ————————————————————————— */}
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
              <h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.8rem,7vw,6.2rem)] font-light leading-[0.92] tracking-sharpest">
                Votre prochain chapitre
                <br />
                commence <span className="italic text-gold-700">ici.</span>
              </h2>
            </Reveal>
            <Reveal delay={190}>
              <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-ink-600">
                Inscription gratuite. Trois photos guidées suffisent pour être présenté aux agences
                vérifiées.
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
                  href="/connexion"
                  className="inline-flex items-center justify-center rounded-full border border-ink-900/15 px-8 py-4 text-[11px] font-semibold uppercase tracking-widest text-ink-800 transition-colors duration-300 hover:border-gold-500 hover:text-gold-700"
                >
                  Se connecter
                </Link>
              </div>
            </Reveal>
            <Reveal delay={360}>
              <p className="mt-8 text-[10px] uppercase tracking-widest text-ink-400">
                18 ans et plus · Photos guidées · Modération humaine
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
