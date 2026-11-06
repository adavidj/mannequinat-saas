import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { NotificationsList } from '@/features/notifications/components/NotificationsList';
import { apiFetchOrNull } from '@/shared/lib/api';
import { getSessionUser } from '@/shared/lib/session';
import type { NotificationList } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/connexion?next=/dashboard/notifications');
  }

  const initial = await apiFetchOrNull<NotificationList>('/notifications?take=50').catch(
    () => null,
  );

  return (
    <NotificationsList
      initial={initial ?? { items: [], total: 0, unreadCount: 0, take: 50, skip: 0 }}
    />
  );
}
