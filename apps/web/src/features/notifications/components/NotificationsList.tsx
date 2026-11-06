'use client';

import Link from 'next/link';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { formatDateTime } from '@/shared/lib/labels';
import {
  alertErrorClass,
  badgeClass,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { NotificationItem, NotificationList, NotificationType } from '@/shared/types/api';

const TYPE_LABELS: Record<NotificationType, string> = {
  WELCOME: 'Bienvenue',
  MESSAGE_RECEIVED: 'Message',
  PHOTO_APPROVED: 'Photo',
  PHOTO_REJECTED: 'Photo',
  EXPERIENCE_APPROVED: 'Expérience',
  EXPERIENCE_REJECTED: 'Expérience',
  ORGANIZATION_APPROVED: 'Organisation',
  ORGANIZATION_REJECTED: 'Organisation',
  REPORT_UPDATED: 'Signalement',
  ACCOUNT_SUSPENDED: 'Compte',
  ACCOUNT_REACTIVATED: 'Compte',
};

const TYPE_STYLES: Record<NotificationType, string> = {
  WELCOME: 'bg-brand-50 text-brand-800 ring-brand-200',
  MESSAGE_RECEIVED: 'bg-sky-50 text-sky-800 ring-sky-200',
  PHOTO_APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  PHOTO_REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  EXPERIENCE_APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  EXPERIENCE_REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  ORGANIZATION_APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  ORGANIZATION_REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  REPORT_UPDATED: 'bg-slate-100 text-slate-700 ring-slate-200',
  ACCOUNT_SUSPENDED: 'bg-red-50 text-red-800 ring-red-200',
  ACCOUNT_REACTIVATED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

export function NotificationsList({ initial }: { initial: NotificationList }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initial.items);
  const [unreadCount, setUnreadCount] = useState(initial.unreadCount);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload(filterUnread: boolean) {
    setBusy(true);
    setError(null);
    try {
      const result = await browserApi<NotificationList>(
        `/notifications?take=50&unreadOnly=${filterUnread ? 'true' : 'false'}`,
      );
      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
    } catch (caught) {
      setError(browserApiMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function selectFilter(filterUnread: boolean) {
    if (filterUnread === unreadOnly) {
      return;
    }
    setUnreadOnly(filterUnread);
    await reload(filterUnread);
  }

  async function markRead(notification: NotificationItem) {
    if (notification.readAt) {
      return;
    }
    setError(null);
    try {
      const updated = await browserApi<NotificationItem>(`/notifications/${notification.id}/read`, {
        method: 'POST',
      });
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (caught) {
      setError(browserApiMessage(caught));
    }
  }

  async function markAllRead() {
    setBusy(true);
    setError(null);
    try {
      await browserApi<{ updated: number }>('/notifications/read-all', { method: 'POST' });
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => (item.readAt ? item : { ...item, readAt })),
      );
      setUnreadCount(0);
      if (unreadOnly) {
        setNotifications([]);
      }
    } catch (caught) {
      setError(browserApiMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Suivez les messages, les décisions de modération et les étapes de votre compte.
            {unreadCount > 0
              ? ` ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}.`
              : ' Tout est à jour.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={unreadOnly ? primaryButtonClass : secondaryButtonClass}
            onClick={() => void selectFilter(true)}
            disabled={busy}
          >
            Non lues
          </button>
          <button
            type="button"
            className={unreadOnly ? secondaryButtonClass : primaryButtonClass}
            onClick={() => void selectFilter(false)}
            disabled={busy}
          >
            Toutes
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => void markAllRead()}
            disabled={busy || unreadCount === 0}
          >
            Tout marquer comme lu
          </button>
        </div>
      </header>

      {error ? (
        <p className={alertErrorClass} role="alert">
          {error}
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <section className={cardClass}>
          <p className="text-sm text-slate-600">
            {unreadOnly ? 'Aucune notification non lue.' : 'Aucune notification pour le moment.'}
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const unread = !notification.readAt;
            return (
              <li
                key={notification.id}
                className={`${cardClass} ${unread ? 'border-brand-200 bg-brand-50/40' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`${badgeClass} ${TYPE_STYLES[notification.type]}`}>
                        {TYPE_LABELS[notification.type]}
                      </span>
                      {unread ? (
                        <span className="text-xs font-semibold text-brand-800">Non lue</span>
                      ) : null}
                      <span className="text-xs text-slate-500">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-slate-900">
                      {notification.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {notification.link ? (
                      <Link
                        className={primaryButtonClass}
                        href={notification.link}
                        onClick={() => void markRead(notification)}
                      >
                        Ouvrir
                      </Link>
                    ) : null}
                    {unread ? (
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => void markRead(notification)}
                      >
                        Marquer comme lu
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        Vous recevez également ces notifications par e-mail lorsque votre compte est actif.
      </p>
    </div>
  );
}
