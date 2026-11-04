import type { Metadata } from 'next';
import Link from 'next/link';

import { apiFetchOrNull } from '@/shared/lib/api';
import {
  MODERATION_LABELS,
  MODERATION_STYLES,
  PROFILE_LEVEL_LABELS,
  VISIBILITY_LABELS,
  VERIFICATION_LABELS,
  VERIFICATION_STYLES,
  formatDateTime,
} from '@/shared/lib/labels';
import { getSessionUser } from '@/shared/lib/session';
import {
  alertInfoClass,
  badgeClass,
  cardClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type {
  AdminExperience,
  AdminOrganization,
  AdminPhoto,
  AdminReport,
  ModelProfile,
  OwnedExperience,
  OwnedOrganization,
  OwnedPhotoWithUrl,
  Paginated,
  SessionUser,
} from '@/shared/types/api';

export const metadata: Metadata = { title: 'Vue d’ensemble' };

const GUIDED_KINDS = ['PORTRAIT', 'FULL_BODY_FRONT', 'FULL_BODY_PROFILE'] as const;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-brand-700">Bonjour</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Votre espace ModelBénin
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{roleIntro(user.role)}</p>
      </header>

      {user.emailVerifiedAt ? null : (
        <p className={alertInfoClass}>
          Votre adresse e-mail n’est pas encore vérifiée. La création de profil, le téléversement de
          photos et la messagerie restent bloqués tant que cette étape n’est pas terminée.{' '}
          <Link className="font-semibold underline" href="/verifier-email">
            Vérifier mon adresse
          </Link>
        </p>
      )}

      {user.role === 'MODELE' ? <ModelOverview /> : null}
      {user.role === 'AGENCE' || user.role === 'FORMATEUR' ? <OrganizationOverview /> : null}
      {user.role === 'ADMIN' ? <AdminOverview /> : null}
    </div>
  );
}

function roleIntro(role: SessionUser['role']): string {
  switch (role) {
    case 'MODELE':
      return 'Complétez votre profil, ajoutez vos trois photos guidées et vos expériences, puis suivez leur modération.';
    case 'AGENCE':
      return 'Faites vérifier votre organisation, puis accédez à la découverte et à la messagerie.';
    case 'FORMATEUR':
      return 'Faites vérifier votre organisme de formation pour rejoindre l’annuaire de confiance.';
    case 'ADMIN':
      return 'Files de modération, vérification des organisations et signalements à traiter.';
  }
}

async function ModelOverview() {
  const [profile, photos, experiences] = await Promise.all([
    apiFetchOrNull<ModelProfile>('/profiles/me'),
    apiFetchOrNull<OwnedPhotoWithUrl[]>('/profiles/me/photos'),
    apiFetchOrNull<OwnedExperience[]>('/profiles/me/experiences'),
  ]);

  if (!profile) {
    return (
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Créez votre profil modèle</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Votre profil rassemble votre nom d’artiste, votre ville, vos mensurations et votre
          préférence de visibilité. Il reste privé jusqu’à l’approbation de vos trois photos
          guidées.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link className={primaryButtonClass} href="/dashboard/profil">
            Créer mon profil
          </Link>
          <Link className={secondaryButtonClass} href="/dashboard/photos">
            Voir mes photos
          </Link>
        </div>
      </section>
    );
  }

  const ownedPhotos = photos ?? [];
  const latestByKind = new Map(ownedPhotos.map((photo) => [photo.kind, photo]));
  const approvedGuided = GUIDED_KINDS.filter(
    (kind) => latestByKind.get(kind)?.moderationStatus === 'APPROVED',
  ).length;
  const pendingCount = ownedPhotos.filter((photo) => photo.moderationStatus === 'PENDING').length;
  const rejectedCount = ownedPhotos.filter((photo) => photo.moderationStatus === 'REJECTED').length;
  const ownedExperiences = experiences ?? [];
  const verifiedExperiences = ownedExperiences.filter((experience) => experience.verified).length;
  const pendingExperiences = ownedExperiences.filter((experience) => !experience.verified).length;

  const steps = [
    {
      title: 'Profil créé',
      done: true,
      detail: `Niveau actuel : ${PROFILE_LEVEL_LABELS[profile.level]}.`,
      href: '/dashboard/profil',
      action: 'Modifier',
    },
    {
      title: 'Trois photos guidées approuvées',
      done: approvedGuided === 3,
      detail: `${approvedGuided} / 3 approuvées${pendingCount ? ` · ${pendingCount} en attente` : ''}${
        rejectedCount ? ` · ${rejectedCount} refusée(s)` : ''
      }.`,
      href: '/dashboard/photos',
      action: 'Gérer mes photos',
    },
    {
      title: 'Une expérience vérifiée',
      done: verifiedExperiences > 0,
      detail: `${verifiedExperiences} vérifiée(s)${pendingExperiences ? ` · ${pendingExperiences} en attente` : ''}.`,
      href: '/dashboard/experiences',
      action: 'Gérer mes expériences',
    },
    {
      title: 'Visibilité agences vérifiées',
      done: profile.visibility !== 'PRIVATE',
      detail: `Visibilité actuelle : ${VISIBILITY_LABELS[profile.visibility]}.`,
      href: '/dashboard/profil',
      action: 'Changer',
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Niveau" value={PROFILE_LEVEL_LABELS[profile.level]} />
        <StatCard label="Photos approuvées" value={`${approvedGuided} / 3`} />
        <StatCard label="Expériences vérifiées" value={String(verifiedExperiences)} />
        <StatCard label="Visibilité" value={VISIBILITY_LABELS[profile.visibility]} />
      </div>

      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Votre progression</h2>
            <p className="mt-1 text-sm text-slate-600">
              Dernière mise à jour du profil : {formatDateTime(profile.updatedAt)}
            </p>
          </div>
          <span className={`${badgeClass} ${VERIFICATION_STYLES.VERIFIED}`}>
            {profile.level === 'CONFIRME' ? 'Profil confirmé' : 'Profil débutant'}
          </span>
        </div>

        <ol className="mt-5 space-y-3">
          {steps.map((step) => (
            <li
              key={step.title}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                  aria-hidden
                >
                  {step.done ? '✓' : '•'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-600">{step.detail}</p>
                </div>
              </div>
              <Link
                className="text-sm font-semibold text-brand-800 hover:text-brand-900"
                href={step.href}
              >
                {step.action}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Dernières photos</h2>
          <Link className={secondaryButtonClass} href="/dashboard/photos">
            Tout voir
          </Link>
        </div>
        {ownedPhotos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Aucune photo pour le moment. Commencez par le portrait, puis les deux photos en pied.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ownedPhotos.slice(0, 3).map((photo) => (
              <li key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={photo.signedUrl}
                  alt={`Photo ${photo.kind.toLowerCase()}`}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-xs text-slate-500">{formatDateTime(photo.createdAt)}</span>
                  <span className={`${badgeClass} ${MODERATION_STYLES[photo.moderationStatus]}`}>
                    {MODERATION_LABELS[photo.moderationStatus]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

async function OrganizationOverview() {
  const organizations = (await apiFetchOrNull<OwnedOrganization[]>('/organizations/me')) ?? [];

  if (organizations.length === 0) {
    return (
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Déclarez votre organisation</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Renseignez votre numéro IFU ou RCCM. Notre équipe vérifie le justificatif avant d’ouvrir
          la découverte et la messagerie.
        </p>
        <Link className={`${primaryButtonClass} mt-5`} href="/dashboard/organisation">
          Créer mon organisation
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Organisations" value={String(organizations.length)} />
        <StatCard
          label="Découverte"
          value={
            organizations.some((organization) => organization.verificationStatus === 'VERIFIED')
              ? 'Disponible'
              : 'En attente de vérification'
          }
        />
      </div>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Mes organisations</h2>
          <Link className={secondaryButtonClass} href="/dashboard/organisation">
            Gérer
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {organizations.map((organization) => (
            <li
              key={organization.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{organization.name}</p>
                <p className="text-xs text-slate-500">
                  Créée le {formatDateTime(organization.createdAt)}
                </p>
              </div>
              <span
                className={`${badgeClass} ${VERIFICATION_STYLES[organization.verificationStatus]}`}
              >
                {VERIFICATION_LABELS[organization.verificationStatus]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {organizations.some((organization) => organization.verificationStatus === 'REJECTED') ? (
        <p className={alertInfoClass}>
          Une organisation a été refusée. Vérifiez les numéros IFU/RCCM saisis puis contactez notre
          équipe pour une nouvelle vérification.
        </p>
      ) : null}
    </>
  );
}

async function AdminOverview() {
  const [photos, experiences, organizations, reports] = await Promise.all([
    apiFetchOrNull<Paginated<AdminPhoto>>('/admin/photos?status=PENDING&take=1'),
    apiFetchOrNull<Paginated<AdminExperience>>('/admin/experiences?verified=false&take=1'),
    apiFetchOrNull<Paginated<AdminOrganization>>(
      '/admin/organizations?verificationStatus=PENDING&take=1',
    ),
    apiFetchOrNull<Paginated<AdminReport>>('/admin/reports?status=OPEN&take=1'),
  ]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Photos à modérer" value={String(photos?.total ?? 0)} />
        <StatCard label="Expériences à vérifier" value={String(experiences?.total ?? 0)} />
        <StatCard label="Organisations à vérifier" value={String(organizations?.total ?? 0)} />
        <StatCard label="Signalements ouverts" value={String(reports?.total ?? 0)} />
      </div>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Files de modération</h2>
        <p className="mt-1 text-sm text-slate-600">
          Traitez les demandes en attente ; chaque décision est journalisée dans l’audit.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className={secondaryButtonClass} href="/dashboard/admin/photos">
            Photos ({photos?.total ?? 0})
          </Link>
          <Link className={secondaryButtonClass} href="/dashboard/admin/experiences">
            Expériences ({experiences?.total ?? 0})
          </Link>
          <Link className={secondaryButtonClass} href="/dashboard/admin/organisations">
            Organisations ({organizations?.total ?? 0})
          </Link>
          <Link className={secondaryButtonClass} href="/dashboard/admin/signalements">
            Signalements ({reports?.total ?? 0})
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>Les photos en attente restent invisibles aux agences jusqu’à approbation.</li>
          <li>Une expérience vérifiée fait passer le profil modèle en « confirmé ».</li>
          <li>Les organisations non vérifiées n’accèdent ni à la découverte ni à la messagerie.</li>
          <li>Chaque consultation de justificatif est tracée.</li>
        </ul>
      </section>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
