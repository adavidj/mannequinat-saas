'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import {
  ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_STYLES,
  formatDate,
  formatDateTime,
} from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  badgeClass,
  cardClass,
  dangerButtonClass,
  primaryButtonClass,
} from '@/shared/lib/ui';
import type { AdminUser, UserStatus } from '@/shared/types/api';

export function UserManagementTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function updateStatus(user: AdminUser, status: Exclude<UserStatus, 'DELETED'>) {
    if (
      status === 'SUSPENDED' &&
      !window.confirm(
        `Suspendre le compte ${user.email} ? Ses sessions seront révoquées et il ne pourra plus se connecter.`,
      )
    ) {
      return;
    }

    setPendingId(user.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await browserApi<AdminUser>(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(
        status === 'SUSPENDED'
          ? `Le compte ${updated.email} est suspendu.`
          : `Le compte ${updated.email} est réactivé.`,
      );
      router.refresh();
    } catch (statusError) {
      setError(browserApiMessage(statusError));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className={alertErrorClass} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className={alertSuccessClass}>{notice}</p> : null}

      {users.length === 0 ? (
        <p className={cardClass}>Aucun compte ne correspond à ces critères.</p>
      ) : (
        <div className={`${cardClass} overflow-x-auto p-0 sm:p-0`}>
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/[0.07] bg-ivory-50/70 text-[10px] uppercase tracking-widest text-ink-500">
                <th scope="col" className="px-5 py-3 font-semibold">
                  Compte
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Rôle
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Statut
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Inscription
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/[0.06]">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const busy = pendingId === user.id;
                return (
                  <tr key={user.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-950">{user.email}</p>
                      <p className="mt-1 text-xs text-ink-400">
                        {user.emailVerifiedAt
                          ? `E-mail vérifié le ${formatDate(user.emailVerifiedAt)}`
                          : 'E-mail non vérifié'}
                        {isSelf ? ' · vous' : ''}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-ink-700">{ROLE_LABELS[user.role]}</td>
                    <td className="px-5 py-4">
                      <span className={`${badgeClass} ${USER_STATUS_STYLES[user.status]}`}>
                        {USER_STATUS_LABELS[user.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-500">
                      <p>{formatDate(user.createdAt)}</p>
                      <p className="mt-0.5 text-ink-400">
                        Mise à jour {formatDateTime(user.updatedAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isSelf ? (
                        <span className="text-xs text-ink-400">Compte courant</span>
                      ) : user.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          className={dangerButtonClass}
                          onClick={() => void updateStatus(user, 'SUSPENDED')}
                          disabled={busy}
                        >
                          {busy ? 'Suspension…' : 'Suspendre'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={primaryButtonClass}
                          onClick={() => void updateStatus(user, 'ACTIVE')}
                          disabled={busy}
                        >
                          {busy ? 'Réactivation…' : 'Réactiver'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-ink-400">
        La suspension révoque immédiatement les sessions actives et notifie la personne. Chaque
        changement de statut est enregistré dans l’audit.
      </p>
    </div>
  );
}
