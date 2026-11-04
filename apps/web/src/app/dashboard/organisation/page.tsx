import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { OrganizationManager } from '@/features/organizations/components/OrganizationManager';
import { apiFetchOrNull } from '@/shared/lib/api';
import { getSessionUser } from '@/shared/lib/session';
import type { OwnedOrganization } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Mon organisation' };

export default async function OrganizationPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== 'AGENCE' && user.role !== 'FORMATEUR')) {
    redirect('/dashboard');
  }

  const organizations = (await apiFetchOrNull<OwnedOrganization[]>('/organizations/me')) ?? [];

  return <OrganizationManager role={user.role} organizations={organizations} />;
}
