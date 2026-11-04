import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { getSessionUser } from '@/shared/lib/session';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/connexion?next=%2Fdashboard');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
