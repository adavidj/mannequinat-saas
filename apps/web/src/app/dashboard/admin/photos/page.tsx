import type { Metadata } from 'next';

import { PhotoModerationQueue } from '@/features/admin/components/PhotoModerationQueue';
import { apiFetch } from '@/shared/lib/api';
import type { AdminPhoto, Paginated } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Modération des photos' };

export default async function AdminPhotosPage() {
  const photos = await apiFetch<Paginated<AdminPhoto>>('/admin/photos?status=PENDING&take=50');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Modération des photos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Vérifiez la conformité aux consignes : visage dégagé, lumière naturelle, corps entier,
          absence de filtre ou de retouche manifeste.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {photos.total} photo{photos.total > 1 ? 's' : ''} en attente.
        </p>
      </header>

      <PhotoModerationQueue initialPhotos={photos.items} />
    </div>
  );
}
