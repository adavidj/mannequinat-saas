import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { apiFetch } from '@/shared/lib/api';
import { getSessionUser } from '@/shared/lib/session';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/connexion?next=%2Fdashboard');
  }

  const unreadCount = await apiFetch<{ unreadCount: number }>('/notifications/unread-count')
    .then((result) => result.unreadCount)
    .catch(() => 0);

  return (
    <DashboardShell user={user} unreadNotifications={unreadCount}>
      {children}
    </DashboardShell>
  );
}
