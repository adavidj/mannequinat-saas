'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { ROLE_LABELS } from '@/shared/lib/labels';
import type { SessionUser } from '@/shared/types/api';

type NavItem = {
  href: string;
  label: string;
  soon?: boolean;
};

function navItemsForRole(role: SessionUser['role']): NavItem[] {
  const common: NavItem[] = [{ href: '/dashboard', label: 'Vue d’ensemble' }];

  if (role === 'MODELE') {
    return [
      ...common,
      { href: '/dashboard/profil', label: 'Mon profil' },
      { href: '/dashboard/photos', label: 'Mes photos' },
      { href: '/dashboard/messages', label: 'Messagerie', soon: true },
    ];
  }

  if (role === 'AGENCE' || role === 'FORMATEUR') {
    return [
      ...common,
      { href: '/dashboard/organisation', label: 'Mon organisation' },
      { href: '/dashboard/decouverte', label: 'Découverte', soon: true },
      { href: '/dashboard/messages', label: 'Messagerie', soon: true },
    ];
  }

  return [...common, { href: '/dashboard/admin', label: 'Back-office', soon: true }];
}

export function DashboardShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const items = navItemsForRole(user.role);

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
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} block />
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
  block = false,
}: {
  item: NavItem;
  active: boolean;
  block?: boolean;
}) {
  const base = block
    ? 'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition'
    : 'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition';

  if (item.soon) {
    return (
      <span
        className={`${base} cursor-not-allowed text-slate-400`}
        title="Disponible dans un prochain lot"
      >
        {item.label}
        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          bientôt
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${base} ${
        active
          ? 'bg-brand-50 text-brand-800'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {item.label}
    </Link>
  );
}
