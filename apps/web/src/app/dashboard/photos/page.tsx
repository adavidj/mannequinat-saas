import type { Metadata } from 'next';
import Link from 'next/link';

import { PhotoManager } from '@/features/photos/components/PhotoManager';
import { apiFetchOrNull } from '@/shared/lib/api';
import { cardClass, primaryButtonClass } from '@/shared/lib/ui';
import type { ModelProfile, OwnedPhotoWithUrl } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Mes photos' };

export default async function PhotosPage() {
  const profile = await apiFetchOrNull<ModelProfile>('/profiles/me');

  if (!profile) {
    return (
      <section className={cardClass}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes photos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Créez d’abord votre profil modèle : les photos sont rattachées à votre profil et suivent
          ses règles de visibilité.
        </p>
        <Link className={`${primaryButtonClass} mt-5`} href="/dashboard/profil">
          Créer mon profil
        </Link>
      </section>
    );
  }

  const photos = (await apiFetchOrNull<OwnedPhotoWithUrl[]>('/profiles/me/photos')) ?? [];
  return <PhotoManager photos={photos} />;
}
