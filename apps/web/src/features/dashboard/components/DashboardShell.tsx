'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { ROLE_LABELS } from '@/shared/lib/labels';
import type { SessionUser } from '@/shared/types/api';

type NavItem = {
  href: string;
  label: string;
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
  const items = navItemsForRole(user.role);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-brand-800">
            ModelBénin
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={loggingOut}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
            </button>
          </div>
        </div>

        <nav className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              badge={badgeFor(item)}
            />
          ))}
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                badge={badgeFor(item)}
                block
              />
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  badge = 0,
  block = false,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  block?: boolean;
}) {
  const base = block
    ? 'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition'
    : 'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition';

  return (
    <Link
      href={item.href}
      className={`${base} ${
        active
          ? 'bg-brand-50 text-brand-800'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span>{item.label}</span>
      {badge > 0 ? (
        <span
          className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
          aria-label={`${badge} notification${badge > 1 ? 's' : ''} non lue${badge > 1 ? 's' : ''}`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
