import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ContactModelButton } from '@/features/discovery/components/ContactModelButton';
import { ApiError, apiFetch, apiFetchOrNull } from '@/shared/lib/api';
import { PROFILE_LEVEL_LABELS } from '@/shared/lib/labels';
import { getSessionUser } from '@/shared/lib/session';
import {
  alertErrorClass,
  alertInfoClass,
  badgeClass,
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { DiscoveryModel, OwnedOrganization, Paginated } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Découverte' };

const PAGE_SIZE = 12;

type DiscoveryPageProps = {
  searchParams: Promise<{
    city?: string;
    level?: string;
    q?: string;
    skip?: string;
  }>;
};

export default async function DiscoveryPage({ searchParams }: DiscoveryPageProps) {
  const user = await getSessionUser();
  if (!user || user.role !== 'AGENCE') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const city = typeof params.city === 'string' ? params.city.trim() : '';
  const level = typeof params.level === 'string' ? params.level : '';
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  const skip = Math.max(0, Number(params.skip ?? 0) || 0);

  const organizations = (await apiFetchOrNull<OwnedOrganization[]>('/organizations/me')) ?? [];
  const verifiedOrganization = organizations.find(
    (organization) =>
      organization.verificationStatus === 'VERIFIED' &&
      (organization.type === 'AGENCY' || organization.type === 'RECRUITER'),
  );

  if (!verifiedOrganization) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Découverte</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            La découverte est réservée aux agences et recruteurs dont l’organisation a été vérifiée
            par notre équipe.
          </p>
        </header>
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-slate-900">Vérification requise</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {organizations.length === 0
              ? 'Déclarez votre organisation avec un numéro IFU ou RCCM pour demander la vérification.'
              : 'Votre organisation est en cours de vérification ou a été refusée. Vous pourrez accéder à la découverte dès sa validation.'}
          </p>
          <Link className={`${primaryButtonClass} mt-5`} href="/dashboard/organisation">
            {organizations.length === 0 ? 'Créer mon organisation' : 'Voir mon organisation'}
          </Link>
        </section>
      </div>
    );
  }

  const query = new URLSearchParams();
  if (city) {
    query.set('city', city);
  }
  if (level) {
    query.set('level', level);
  }
  if (q) {
    query.set('q', q);
  }
  query.set('take', String(PAGE_SIZE));
  query.set('skip', String(skip));

  let results: Paginated<DiscoveryModel> | null = null;
  let error: string | null = null;
  try {
    results = await apiFetch<Paginated<DiscoveryModel>>(`/discovery/models?${query.toString()}`);
  } catch (fetchError) {
    error =
      fetchError instanceof ApiError
        ? fetchError.message
        : 'La découverte est momentanément indisponible.';
  }

  const buildPageHref = (nextSkip: number): string => {
    const next = new URLSearchParams();
    if (city) {
      next.set('city', city);
    }
    if (level) {
      next.set('level', level);
    }
    if (q) {
      next.set('q', q);
    }
    if (nextSkip > 0) {
      next.set('skip', String(nextSkip));
    }
    const suffix = next.toString();
    return suffix ? `/dashboard/decouverte?${suffix}` : '/dashboard/decouverte';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Découverte</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Profils ayant accepté d’être visibles par les agences vérifiées. Les coordonnées
            personnelles ne sont jamais affichées : utilisez la messagerie.
          </p>
        </div>
        <span className={`${badgeClass} bg-emerald-50 text-emerald-800 ring-emerald-200`}>
          {verifiedOrganization.name} vérifiée
        </span>
      </header>

      <section className={cardClass}>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" action="/dashboard/decouverte">
          <div>
            <label className={labelClass} htmlFor="q">
              Nom
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              className={inputClass}
              placeholder="Nom d’artiste"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="city">
              Ville
            </label>
            <input
              id="city"
              name="city"
              defaultValue={city}
              className={inputClass}
              placeholder="Cotonou"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="level">
              Niveau
            </label>
            <select id="level" name="level" defaultValue={level} className={inputClass}>
              <option value="">Tous les niveaux</option>
              <option value="DEBUTANT">Débutant</option>
              <option value="CONFIRME">Confirmé</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className={primaryButtonClass}>
              Rechercher
            </button>
            <Link className={secondaryButtonClass} href="/dashboard/decouverte">
              Réinitialiser
            </Link>
          </div>
        </form>
      </section>

      {error ? (
        <p className={alertErrorClass} role="alert">
          {error}
        </p>
      ) : null}

      {results ? (
        <p className={alertInfoClass}>
          {results.total === 0
            ? 'Aucun profil ne correspond à ces critères.'
            : `${results.total} profil${results.total > 1 ? 's' : ''} correspondant${results.total > 1 ? 's' : ''}.`}
        </p>
      ) : null}

      {results && results.items.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.items.map((model) => (
            <DiscoveryCard key={model.id} model={model} />
          ))}
        </div>
      ) : null}

      {results && (skip > 0 || results.items.length === PAGE_SIZE) ? (
        <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
          {skip > 0 ? (
            <Link
              className={secondaryButtonClass}
              href={buildPageHref(Math.max(0, skip - PAGE_SIZE))}
            >
              Précédent
            </Link>
          ) : (
            <span />
          )}
          {results.items.length === PAGE_SIZE ? (
            <Link className={secondaryButtonClass} href={buildPageHref(skip + PAGE_SIZE)}>
              Suivant
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function DiscoveryCard({ model }: { model: DiscoveryModel }) {
  const [mainPhoto, ...otherPhotos] = model.photos;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[3/4] bg-slate-100">
        {mainPhoto ? (
          <img
            src={mainPhoto.url}
            alt={`Photo de ${model.displayName}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
            Aucune photo approuvée
          </div>
        )}
      </div>

      {otherPhotos.length > 0 ? (
        <div className="flex gap-1 px-1 pt-1">
          {otherPhotos.slice(0, 2).map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="h-14 w-12 rounded object-cover"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{model.displayName}</h2>
            <span className={`${badgeClass} bg-brand-50 text-brand-800 ring-brand-200`}>
              {PROFILE_LEVEL_LABELS[model.level]}
            </span>
          </div>
          <p className="text-sm text-slate-500">{model.city}</p>
        </div>

        {model.bio ? (
          <p className="line-clamp-4 text-sm leading-6 text-slate-600">{model.bio}</p>
        ) : null}

        <div className="mt-auto">
          <ContactModelButton profileId={model.id} />
        </div>
      </div>
    </article>
  );
}
