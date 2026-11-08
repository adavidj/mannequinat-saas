import type { Metadata } from 'next';
import Link from 'next/link';

import { apiFetch } from '@/shared/lib/api';
import { ROLE_LABELS, formatDateTime } from '@/shared/lib/labels';
import { cardClass, secondaryButtonClass } from '@/shared/lib/ui';
import type {
  AdminExperience,
  AdminOrganization,
  AdminPhoto,
  AdminReport,
  AdminStats,
  Paginated,
  UserRole,
} from '@/shared/types/api';

export const metadata: Metadata = { title: 'Back-office' };

export default async function AdminHomePage() {
  const [stats, photos, experiences, organizations, reports] = await Promise.all([
    apiFetch<AdminStats>('/admin/stats'),
    apiFetch<Paginated<AdminPhoto>>('/admin/photos?status=PENDING&take=1'),
    apiFetch<Paginated<AdminExperience>>('/admin/experiences?verified=false&take=1'),
    apiFetch<Paginated<AdminOrganization>>(
      '/admin/organizations?verificationStatus=PENDING&take=1',
    ),
    apiFetch<Paginated<AdminReport>>('/admin/reports?status=OPEN&take=1'),
  ]);

  const queues = [
    {
      href: '/dashboard/admin/photos',
      title: 'Modération des photos',
      count: photos.total,
      description: 'Approuver ou refuser les photos guidées et les portfolios.',
    },
    {
      href: '/dashboard/admin/experiences',
      title: 'Vérification des expériences',
      count: experiences.total,
      description: 'Valider les expériences et leurs justificatifs pour confirmer un profil.',
    },
    {
      href: '/dashboard/admin/organisations',
      title: 'Vérification des organisations',
      count: organizations.total,
      description: 'Contrôler les justificatifs IFU/RCCM des agences et formateurs.',
    },
    {
      href: '/dashboard/admin/signalements',
      title: 'Signalements',
      count: reports.total,
      description: 'Traiter les comportements abusifs signalés par les membres.',
    },
  ];

  const headline = [
    {
      label: 'Comptes',
      value: stats.users.total,
      detail: `${stats.users.newLast7Days} nouveau${stats.users.newLast7Days > 1 ? 'x' : ''} sur 7 jours · ${stats.users.suspended} suspendu${stats.users.suspended > 1 ? 's' : ''}`,
    },
    {
      label: 'Profils modèles',
      value: stats.profiles.total,
      detail: `${stats.profiles.byLevel.CONFIRME} confirmés · ${stats.profiles.byLevel.DEBUTANT} débutants`,
    },
    {
      label: 'Photos en attente',
      value: stats.photos.pending,
      detail: `${stats.photos.approved} approuvées · ${stats.photos.rejected} refusées`,
    },
    {
      label: 'Signalements ouverts',
      value: stats.reports.open,
      detail: `${stats.reports.inReview} en cours · ${stats.reports.resolved} résolus`,
    },
  ];

  const roleRows = (Object.keys(ROLE_LABELS) as UserRole[]).map((role) => ({
    label: ROLE_LABELS[role],
    value: stats.users.byRole[role],
  }));

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Back-office</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Chaque décision est journalisée dans l’audit. Les justificatifs et photos ne sont
            visibles que par les administrateurs.
          </p>
        </div>
        <Link className={secondaryButtonClass} href="/dashboard/admin/utilisateurs">
          Gérer les utilisateurs
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {headline.map((item) => (
          <section key={item.label} className={cardClass}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
              {item.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
          </section>
        ))}
      </div>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Files de modération</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Les demandes restent en file tant qu’une décision n’a pas été prise. Chaque décision
          notifie la personne concernée.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {queues.map((queue) => (
            <div key={queue.href} className="flex flex-col rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {queue.title}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                {queue.count}
              </p>
              <p className="mt-2 flex-1 text-xs leading-5 text-slate-600">{queue.description}</p>
              <Link className={`${secondaryButtonClass} mt-3`} href={queue.href}>
                Ouvrir la file
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Breakdown title="Comptes par rôle" rows={roleRows} />
        <Breakdown
          title="Profils par niveau"
          rows={[
            { label: 'Débutant', value: stats.profiles.byLevel.DEBUTANT },
            { label: 'Confirmé', value: stats.profiles.byLevel.CONFIRME },
          ]}
        />
        <Breakdown
          title="Visibilité des profils"
          rows={[
            { label: 'Privé', value: stats.profiles.byVisibility.PRIVATE },
            { label: 'Agences vérifiées', value: stats.profiles.byVisibility.VERIFIED_AGENCIES },
            { label: 'Public', value: stats.profiles.byVisibility.PUBLIC },
          ]}
        />
        <Breakdown
          title="Organisations"
          rows={[
            { label: 'En attente', value: stats.organizations.pending },
            { label: 'Vérifiées', value: stats.organizations.verified },
            { label: 'Refusées', value: stats.organizations.rejected },
          ]}
        />
        <Breakdown
          title="Expériences"
          rows={[
            { label: 'En attente', value: stats.experiences.pending },
            { label: 'Vérifiées', value: stats.experiences.verified },
          ]}
        />
        <Breakdown
          title="Messagerie"
          rows={[
            { label: 'Conversations', value: stats.messaging.conversations },
            { label: 'Messages échangés', value: stats.messaging.messages },
            { label: 'Messages sur 7 jours', value: stats.messaging.messagesLast7Days },
          ]}
        />
      </div>

      <section className={cardClass}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Activité récente</h2>
            <p className="mt-1 text-sm text-slate-600">
              Les douze dernières actions sensibles enregistrées dans l’audit.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Instantané du {formatDateTime(stats.generatedAt)}
          </p>
        </div>

        {stats.activity.length === 0 ? (
          <p className="mt-4 rounded-xl border border-slate-200 px-4 py-6 text-sm text-slate-500">
            Aucune action enregistrée pour le moment.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-slate-100">
            {stats.activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-slate-800">{entry.action}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.entityType} · {entry.entityId}
                    {entry.actor ? ` · ${entry.actor.email}` : ' · système'}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-slate-400" dateTime={entry.createdAt}>
                  {formatDateTime(entry.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">État des comptes</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Actifs', value: stats.users.active },
            { label: 'Suspendus', value: stats.users.suspended },
            { label: 'E-mail vérifié', value: stats.users.verified },
            { label: 'E-mail à vérifier', value: stats.users.unverified },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <section className={cardClass}>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-semibold tabular-nums text-slate-900">{row.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-ink-800"
                style={{ width: `${Math.round((row.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
