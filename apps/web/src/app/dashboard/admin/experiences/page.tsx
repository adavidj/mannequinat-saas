import type { Metadata } from 'next';

import { ExperienceReviewQueue } from '@/features/admin/components/ExperienceReviewQueue';
import { apiFetch } from '@/shared/lib/api';
import type { AdminExperience, Paginated } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Vérification des expériences' };

export default async function AdminExperiencesPage() {
  const experiences = await apiFetch<Paginated<AdminExperience>>(
    '/admin/experiences?verified=false&take=50',
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Vérification des expériences
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Une expérience vérifiée fait passer le profil modèle en « confirmé » et ouvre la
          visibilité publique. Contrôlez le justificatif lorsqu’il existe.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {experiences.total} expérience{experiences.total > 1 ? 's' : ''} en attente.
        </p>
      </header>

      <ExperienceReviewQueue initialExperiences={experiences.items} />
    </div>
  );
}
