import type { Metadata } from 'next';

import { ProfileEditor } from '@/features/profiles/components/ProfileEditor';
import { apiFetchOrNull } from '@/shared/lib/api';
import type { ModelProfile } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function ProfilePage() {
  const profile = await apiFetchOrNull<ModelProfile>('/profiles/me');
  return <ProfileEditor initialProfile={profile} />;
}
