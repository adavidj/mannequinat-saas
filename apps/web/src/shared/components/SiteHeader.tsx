'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ArrowRightIcon, CloseIcon, MenuIcon } from './icons';

const NAV = [
  { href: '/maison', label: 'La maison', number: '01' },
  { href: '/parcours', label: 'Parcours', number: '02' },
  { href: '/talents', label: 'Talents', number: '03' },
  { href: '/confiance', label: 'Confiance', number: '04' },
];

export function SiteHeader({ variant = 'overlay' }: { variant?: 'overlay' | 'solid' }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onScroll() {
      const top = window.scrollY;
      setScrolled(top > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, top / max) : 0);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    if (!open) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const overlay = variant === 'overlay';
  // Sur les pages publiques, le fond du header est toujours sombre (hero noir
  // en haut, voile d'encre au scroll) : le texte reste ivoire dans les deux cas.
  const light = overlay;

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-gold-300 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-widest focus:text-ink-950"
      >
        Aller au contenu
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-expo ${
          overlay
            ? scrolled
              ? 'border-b border-white/10 bg-ink-950/90 backdrop-blur-sm'
              : 'border-b border-transparent bg-transparent'
            : 'border-b border-ink-900/10 bg-ivory-100/85 backdrop-blur-xl'
        }`}
      >
        <div className="container-editorial">
          <div
            className={`flex items-center justify-between gap-6 transition-[height] duration-500 ease-expo ${
              scrolled ? 'h-[68px]' : 'h-[76px]'
            }`}
          >
            <Link href="/" className="group inline-flex items-baseline gap-1.5">
              <span
                className={`font-display font-medium leading-none tracking-sharpest transition-all duration-500 ${
                  light ? 'text-ivory-50' : 'text-ink-950'
                } ${scrolled ? 'text-[25px]' : 'text-[27px]'}`}
              >
                Model<span className="italic text-gold-500">Bénin</span>
              </span>
              <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-gold-400 transition-transform duration-500 group-hover:scale-150" />
            </Link>

            <nav className="hidden items-center gap-9 lg:flex" aria-label="Navigation principale">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={active}
                    aria-current={active ? 'page' : undefined}
                    className={`nav-link ${
                      light ? 'text-ivory-100' : 'text-ink-800'
                    } ${active ? 'text-gold-300' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/connexion"
                className={`hidden text-[13px] font-medium tracking-wide transition-colors duration-300 sm:inline-flex ${
                  light
                    ? 'text-ivory-100/85 hover:text-gold-200'
                    : 'text-ink-800 hover:text-gold-600'
                }`}
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="btn-shine hidden items-center gap-2 rounded-full bg-gold-300 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-ink-950 shadow-gold transition-colors duration-300 hover:bg-gold-200 sm:inline-flex"
              >
                Créer mon profil
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Ouvrir le menu"
                aria-expanded={open}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 lg:hidden ${
                  light
                    ? 'border-white/25 text-ivory-100 hover:border-gold-300'
                    : 'border-ink-900/15 text-ink-900 hover:border-gold-500'
                }`}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`h-px origin-left bg-gold-400/70 transition-transform duration-150 ${
            scrolled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: `scaleX(${progress})` }}
        />
      </header>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={`fixed inset-0 z-[70] bg-ink-950 text-ivory-50 transition-all duration-500 ease-expo lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="grain pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-editorial relative flex h-full flex-col">
          <div className="flex h-[76px] items-center justify-between">
            <Link href="/" className="font-display text-[27px] font-medium tracking-sharpest">
              Model<span className="italic text-gold-400">Bénin</span>
            </Link>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-ivory-100 transition-colors hover:border-gold-300"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-10 flex flex-1 flex-col justify-center gap-1" aria-label="Menu mobile">
            {NAV.map((item, index) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className="group flex items-center justify-between border-b border-white/10 py-5 transition-colors duration-300"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateY(0)' : 'translateY(18px)',
                    transition: `opacity 0.6s var(--ease-expo) ${100 + index * 70}ms, transform 0.6s var(--ease-expo) ${
                      100 + index * 70
                    }ms`,
                  }}
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[10px] tracking-widest text-gold-400/60">
                      {item.number}
                    </span>
                    <span
                      className={`font-display text-4xl font-light tracking-tight transition-colors group-hover:text-gold-300 sm:text-5xl ${
                        active ? 'italic text-gold-300' : 'text-ivory-50'
                      }`}
                    >
                      {item.label}
                    </span>
                  </span>
                  <ArrowRightIcon className="h-5 w-5 -translate-x-2 text-gold-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-5 pb-10 pt-8">
            <div className="flex flex-col gap-3">
              <Link
                href="/inscription"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-6 py-4 text-xs font-bold uppercase tracking-widest text-ink-950"
              >
                Créer mon profil
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/connexion"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-ivory-100"
              >
                Se connecter
              </Link>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-ivory-100/40">
              Cotonou · Bénin — Maison de mannequinat
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
