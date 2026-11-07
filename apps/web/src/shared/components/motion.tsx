'use client';

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  variant?: 'up' | 'scale';
  once?: boolean;
};

type RevealEntry = { element: HTMLElement; once: boolean };

/**
 * Gestion partagée des révélations. Un seul IntersectionObserver et un seul
 * écouteur de scroll (throttlé sur `requestAnimationFrame`) pour toute la page.
 *
 * Le scroll sert de filet de sécurité : si le thread principal est saturé (3D,
 * hydratation, appareil lent), l'observateur peut manquer des intersections.
 * Le balayage révèle alors tout élément déjà entré par le bas de l'écran.
 */
const revealEntries = new Set<RevealEntry>();
let revealObserver: IntersectionObserver | null = null;
let revealListening = false;

function revealNow(entry: RevealEntry) {
  entry.element.dataset.visible = 'true';
  if (entry.once) unregisterReveal(entry);
}

function unregisterReveal(entry: RevealEntry) {
  revealEntries.delete(entry);
  revealObserver?.unobserve(entry.element);
}

function revealSweep() {
  const limit = window.innerHeight * 0.94;
  for (const entry of [...revealEntries]) {
    if (entry.element.getBoundingClientRect().top < limit) revealNow(entry);
  }
}

function ensureRevealManager() {
  if (revealListening || typeof window === 'undefined') return;
  revealListening = true;
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const match = [...revealEntries].find((item) => item.element === target);
        if (!match) continue;
        if (entry.isIntersecting) {
          revealNow(match);
        } else if (!match.once) {
          target.dataset.visible = 'false';
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  // Balayage direct : contrairement à rAF/IO, il n'est pas affamé quand le
  // thread principal est occupé (3D, hydratation, appareil lent).
  window.addEventListener('scroll', revealSweep, { passive: true });
  window.addEventListener('resize', revealSweep, { passive: true });
  // Marqueur d'hydratation des révélations (utile aux tests automatisés).
  document.documentElement.dataset.reveal = 'ready';
}

function registerReveal(entry: RevealEntry) {
  revealEntries.add(entry);
  if (typeof IntersectionObserver === 'undefined') {
    revealNow(entry);
    return;
  }
  ensureRevealManager();
  revealObserver?.observe(entry.element);
  // Vérifie l'état initial : l'effet court après le calcul de layout.
  if (entry.element.getBoundingClientRect().top < window.innerHeight * 0.94) revealNow(entry);
}

/**
 * Apparition au scroll. Le masquage initial vient uniquement du CSS : le
 * serveur ne rend aucun attribut `data-visible`, l'observateur le pose après
 * hydratation. Cela évite tout décalage entre HTML serveur et client.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  distance,
  variant = 'up',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const entry: RevealEntry = { element, once };
    registerReveal(entry);
    return () => unregisterReveal(entry);
  }, [once]);

  const style = {
    '--reveal-delay': `${delay}ms`,
    ...(distance ? { '--reveal-distance': `${distance}px` } : {}),
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`reveal ${variant === 'scale' ? 'reveal-scale' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * Carte inclinable à la souris (perspective CSS). Utilisée pour la pile de
 * portraits du hero et les visuels éditoriaux.
 */
export function Tilt({
  children,
  className = '',
  max = 8,
  scale = 1,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: ReactPointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    element.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
    element.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
    element.style.setProperty('--tilt-scale', `${scale}`);
  }

  function handleLeave() {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty('--rx', '0deg');
    element.style.setProperty('--ry', '0deg');
    element.style.setProperty('--tilt-scale', '1');
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`tilt-card ${className}`}
      style={{
        ...style,
        transform: 'perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Bandeau défilant infini. Les enfants sont dupliqués pour une boucle sans
 * couture ; la copie est masquée aux lecteurs d'écran.
 */
export function Marquee({
  children,
  reverse = false,
  duration,
  className = '',
  trackClassName = '',
}: {
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
  trackClassName?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`marquee-track flex w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} ${trackClassName}`}
        style={duration ? { animationDuration: `${duration}s` } : undefined}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Léger effet magnétique au survol, réservé aux appels à l'action. */
export function Magnetic({
  children,
  className = '',
  strength = 10,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function handleMove(event: ReactPointerEvent<HTMLSpanElement>) {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    element.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
  }

  function handleLeave() {
    const element = ref.current;
    if (!element) return;
    element.style.transform = 'translate3d(0, 0, 0)';
  }

  return (
    <span
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`inline-block transition-transform duration-300 ease-expo ${className}`}
    >
      {children}
    </span>
  );
}
