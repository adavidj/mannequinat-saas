'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';

import {
  ArrowUpRightIcon,
  BellIcon,
  BuildingIcon,
  CameraIcon,
  CloseIcon,
  CompassIcon,
  FlagIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  MessageIcon,
  SettingsIcon,
  ShieldIcon,
  SparkIcon,
  UserIcon,
} from '@/shared/components/icons';
import { ROLE_LABELS } from '@/shared/lib/labels';
import type { SessionUser } from '@/shared/types/api';

type NavItem = {
  href: string;
  label: string;
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, IconComponent> = {
  '/dashboard': HomeIcon,
  '/dashboard/profil': UserIcon,
  '/dashboard/photos': CameraIcon,
  '/dashboard/experiences': SparkIcon,
  '/dashboard/messages': MessageIcon,
  '/dashboard/notifications': BellIcon,
  '/dashboard/compte': SettingsIcon,
  '/dashboard/organisation': BuildingIcon,
  '/dashboard/decouverte': CompassIcon,
  '/dashboard/admin/photos': CameraIcon,
  '/dashboard/admin/experiences': SparkIcon,
  '/dashboard/admin/organisations': ShieldIcon,
  '/dashboard/admin/signalements': FlagIcon,
};

function navItemsForRole(role: SessionUser['role']): NavItem[] {
  const common: NavItem[] = [{ href: '/dashboard', label: 'Vue d’ensemble' }];
  const notifications: NavItem = {
    href: '/dashboard/notifications',
    label: 'Notifications',
  };
  const account: NavItem = { href: '/dashboard/compte', label: 'Mon compte' };

  if (role === 'MODELE') {
    return [
      ...common,
      { href: '/dashboard/profil', label: 'Mon profil' },
      { href: '/dashboard/photos', label: 'Mes photos' },
      { href: '/dashboard/experiences', label: 'Mes expériences' },
      { href: '/dashboard/messages', label: 'Messagerie' },
      notifications,
      account,
    ];
  }

  if (role === 'AGENCE') {
    return [
      ...common,
      { href: '/dashboard/organisation', label: 'Mon organisation' },
      { href: '/dashboard/decouverte', label: 'Découverte' },
      { href: '/dashboard/messages', label: 'Messagerie' },
      notifications,
      account,
    ];
  }

  if (role === 'FORMATEUR') {
    return [
      ...common,
      { href: '/dashboard/organisation', label: 'Mon organisation' },
      notifications,
      account,
    ];
  }

  return [
    ...common,
    { href: '/dashboard/admin/photos', label: 'Modération photos' },
    { href: '/dashboard/admin/experiences', label: 'Expériences' },
    { href: '/dashboard/admin/organisations', label: 'Vérifications' },
    { href: '/dashboard/admin/signalements', label: 'Signalements' },
    notifications,
    account,
  ];
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentTitle(pathname: string, items: NavItem[]): string {
  const match = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActivePath(pathname, item.href));
  return match?.label ?? 'Tableau de bord';
}

export function DashboardShell({
  user,
  unreadNotifications = 0,
  children,
}: {
  user: SessionUser;
  unreadNotifications?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navItemsForRole(user.role);
  const primary = items.filter(
    (item) => item.href !== '/dashboard/notifications' && item.href !== '/dashboard/compte',
  );
  const secondary = items.filter(
    (item) => item.href === '/dashboard/notifications' || item.href === '/dashboard/compte',
  );
  const title = currentTitle(pathname, items);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function badgeFor(item: NavItem): number {
    return item.href === '/dashboard/notifications' ? unreadNotifications : 0;
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/connexion');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-6 pt-6">
        <Link href="/" className="group inline-flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-medium tracking-sharpest text-ivory-50">
            Model<span className="italic text-gold-400">Bénin</span>
          </span>
          <span className="h-1 w-1 translate-y-[-2px] rounded-full bg-gold-400" />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-ivory-100/70 lg:hidden"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-4 mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gold-500">
          {ROLE_LABELS[user.role]}
        </p>
        <p className="mt-1.5 truncate text-[12px] text-ivory-100/60">{user.email}</p>
      </div>

      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 pb-6"
        aria-label="Navigation du tableau de bord"
      >
        <div>
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-widest text-ivory-100/25">
            Espace
          </p>
          <ul className="space-y-1">
            {primary.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  badge={badgeFor(item)}
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-widest text-ivory-100/25">
            Compte
          </p>
          <ul className="space-y-1">
            {secondary.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  badge={badgeFor(item)}
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] text-ivory-100/50 transition-colors hover:bg-white/5 hover:text-ivory-50"
        >
          Voir le site public
          <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] text-ivory-100/50 transition-colors hover:bg-white/5 hover:text-ivory-50 disabled:opacity-50"
        >
          <LogoutIcon className="h-4 w-4" />
          {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] border-r border-white/5 bg-ink-950 lg:block">
        {sidebar}
      </aside>

      {/* Tiroir mobile */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-ink-950/60 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 w-[290px] max-w-[85vw] bg-ink-950 shadow-2xl transition-transform duration-500 ease-expo ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebar}
        </div>
      </div>

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 border-b border-ink-900/[0.07] bg-ivory-100/85 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Ouvrir la navigation"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-900/15 text-ink-800 lg:hidden"
              >
                <MenuIcon className="h-[18px] w-[18px]" />
              </button>
              <div className="min-w-0">
                <p className="hidden text-[9px] font-semibold uppercase tracking-widest text-ink-400 sm:block">
                  ModelBénin · {ROLE_LABELS[user.role]}
                </p>
                <h1 className="truncate font-display text-[22px] font-medium leading-tight tracking-tight text-ink-950">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/notifications"
                aria-label="Notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/10 text-ink-700 transition-colors hover:border-gold-500 hover:text-gold-700"
              >
                <BellIcon className="h-4 w-4" />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[9px] font-bold leading-none text-ink-950">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/dashboard/compte"
                className="group inline-flex items-center gap-2.5 rounded-full border border-ink-900/10 py-1 pl-1 pr-3 transition-colors hover:border-gold-500/70"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-[10px] font-semibold uppercase text-gold-300">
                  {user.email.slice(0, 1)}
                </span>
                <span className="hidden text-[11px] font-medium text-ink-700 sm:block">
                  Mon compte
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-9 lg:py-10">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  badge = 0,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  const Icon = ICONS[item.href] ?? HomeIcon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-300 ${
        active
          ? 'bg-white/[0.07] text-ivory-50'
          : 'text-ivory-100/50 hover:bg-white/[0.04] hover:text-ivory-100'
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gold-400 transition-all duration-300 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors duration-300 ${
          active ? 'text-gold-300' : 'text-ivory-100/35 group-hover:text-gold-400/70'
        }`}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {badge > 0 ? (
        <span
          className="rounded-full bg-gold-400 px-1.5 py-0.5 text-[9px] font-bold leading-none text-ink-950"
          aria-label={`${badge} notification${badge > 1 ? 's' : ''} non lue${badge > 1 ? 's' : ''}`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
