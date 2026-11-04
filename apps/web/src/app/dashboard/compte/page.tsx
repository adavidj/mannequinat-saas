import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AccountManager } from '@/features/account/components/AccountManager';
import { getSessionUser } from '@/shared/lib/session';

export const metadata: Metadata = { title: 'Mon compte' };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/connexion?next=/dashboard/compte');
  }

  return <AccountManager email={user.email} />;
}
