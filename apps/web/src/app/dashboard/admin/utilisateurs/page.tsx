import type { Metadata } from 'next';
import Link from 'next/link';

import { UserManagementTable } from '@/features/admin/components/UserManagementTable';
import { apiFetch } from '@/shared/lib/api';
import { ROLE_LABELS, USER_STATUS_LABELS } from '@/shared/lib/labels';
import { getSessionUser } from '@/shared/lib/session';
import { cardClass, inputClass, labelClass, secondaryButtonClass } from '@/shared/lib/ui';
import type { AdminUser, Paginated, UserRole, UserStatus } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Gestion des utilisateurs' };

const ROLES: UserRole[] = ['MODELE', 'AGENCE', 'FORMATEUR', 'ADMIN'];
const STATUSES: UserStatus[] = ['ACTIVE', 'SUSPENDED', 'DELETED'];

type SearchParams = {
  role?: string;
  status?: string;
  q?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const role = ROLES.find((value) => value === params.role);
  const status = STATUSES.find((value) => value === params.status);
  const search = params.q?.trim() ?? '';
  const query = new URLSearchParams({ take: '50' });
  if (role) {
    query.set('role', role);
  }
  if (status) {
    query.set('status', status);
  }
  if (search.length >= 2) {
    query.set('q', search);
  }

  const [users, session] = await Promise.all([
    apiFetch<Paginated<AdminUser>>(`/admin/users?${query.toString()}`),
    getSessionUser(),
  ]);

  const filtered = Boolean(role || status || search);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestion des utilisateurs
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Recherchez un compte par adresse e-mail, filtrez par rôle ou statut, puis suspendez ou
            réactivez l’accès. Une suspension coupe les sessions en cours.
          </p>
        </div>
        <Link className={secondaryButtonClass} href="/dashboard/admin">
          Retour au back-office
        </Link>
      </header>

      <form method="get" className={`${cardClass} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <div className="lg:col-span-2">
          <label className={labelClass} htmlFor="q">
            Recherche
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="adresse@exemple.bj"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="role">
            Rôle
          </label>
          <select id="role" name="role" defaultValue={role ?? ''} className={inputClass}>
            <option value="">Tous les rôles</option>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Statut
          </label>
          <select id="status" name="status" defaultValue={status ?? ''} className={inputClass}>
            <option value="">Tous les statuts</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {USER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
          <button type="submit" className={secondaryButtonClass}>
            Filtrer
          </button>
          {filtered ? (
            <Link
              className="text-xs font-medium text-slate-500 underline"
              href="/dashboard/admin/utilisateurs"
            >
              Réinitialiser les filtres
            </Link>
          ) : null}
          <p className="ml-auto text-sm font-medium text-slate-700">
            {users.total} compte{users.total > 1 ? 's' : ''}
            {users.total > users.items.length
              ? ` · ${users.items.length} affiché${users.items.length > 1 ? 's' : ''}`
              : ''}
          </p>
        </div>
      </form>

      <UserManagementTable initialUsers={users.items} currentUserId={session?.id ?? ''} />
    </div>
  );
}
