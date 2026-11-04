import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ExperienceManager } from '@/features/experiences/components/ExperienceManager';
import { apiFetchOrNull } from '@/shared/lib/api';
import { getSessionUser } from '@/shared/lib/session';
import { cardClass, primaryButtonClass } from '@/shared/lib/ui';
import type { ModelProfile, OwnedExperience } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Mes expériences' };

export default async function ExperiencesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'MODELE') {
    redirect('/dashboard');
  }

  const profile = await apiFetchOrNull<ModelProfile>('/profiles/me');
  if (!profile) {
    return (
      <section className={cardClass}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes expériences</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Créez d’abord votre profil modèle : les expériences sont rattachées à votre profil.
        </p>
        <Link className={`${primaryButtonClass} mt-5`} href="/dashboard/profil">
          Créer mon profil
        </Link>
      </section>
    );
  }

  const experiences = (await apiFetchOrNull<OwnedExperience[]>('/profiles/me/experiences')) ?? [];

  return <ExperienceManager experiences={experiences} />;
}
