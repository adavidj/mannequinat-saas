import Link from 'next/link';

import { ArrowUpRightIcon } from './icons';

const COLUMNS = [
  {
    title: 'Plateforme',
    links: [
      { href: '/inscription', label: 'Créer un profil' },
      { href: '/connexion', label: 'Se connecter' },
      { href: '/talents', label: 'Découvrir les talents' },
      { href: '/tarifs', label: 'Tarifs & formules' },
    ],
  },
  {
    title: 'La maison',
    links: [
      { href: '/maison', label: 'Notre approche' },
      { href: '/parcours', label: 'Les deux niveaux' },
      { href: '/confiance', label: 'Confiance & sécurité' },
    ],
  },
  {
    title: 'Informations',
    links: [
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/cgu', label: 'Conditions générales' },
      { href: '/confidentialite', label: 'Confidentialité' },
      { href: '/confiance#signaler', label: 'Signaler un abus' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink-950 text-ivory-100">
      <div className="grain pointer-events-none absolute inset-0 opacity-50" />
      <div className="container-editorial relative">
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-[1.3fr_2fr] lg:py-20">
          <div>
            <Link href="/" className="inline-flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-medium tracking-sharpest">
                Model<span className="italic text-gold-400">Bénin</span>
              </span>
              <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-gold-400" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-ivory-100/55">
              La maison numérique du mannequinat béninois. Des profils vérifiés, des agences
              authentifiées, et un œil humain sur chaque image.
            </p>
            <p className="mt-8 font-display text-xl italic text-gold-300/90">
              « L’élégance n’a pas besoin de bruit. »
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-500">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-sm text-ivory-100/65 transition-colors duration-300 hover:text-ivory-50"
                      >
                        {link.label}
                        <ArrowUpRightIcon className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 py-7 text-[11px] uppercase tracking-widest text-ivory-100/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ModelBénin — Cotonou, Bénin</p>
          <p className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gold-500" />
            Conçu avec exigence · Réservé aux 18 ans et plus
          </p>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none select-none pb-6 text-center font-display text-[clamp(3.5rem,13vw,12rem)] font-light leading-[0.8] tracking-sharpest text-white/[0.04]"
        >
          MODELBÉNIN
        </div>
      </div>
    </footer>
  );
}
