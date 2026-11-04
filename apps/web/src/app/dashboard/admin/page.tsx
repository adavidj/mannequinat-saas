import type { Metadata } from 'next';
import Link from 'next/link';

import { apiFetch } from '@/shared/lib/api';
import { cardClass, secondaryButtonClass } from '@/shared/lib/ui';
import type { AdminOrganization, AdminPhoto, AdminReport, Paginated } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Back-office' };

export default async function AdminHomePage() {
  const [photos, organizations, reports] = await Promise.all([
    apiFetch<Paginated<AdminPhoto>>('/admin/photos?status=PENDING&take=1'),
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Back-office</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Chaque décision est journalisée dans l’audit. Les justificatifs et photos ne sont visibles
          que par les administrateurs.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {queues.map((queue) => (
          <section key={queue.href} className={cardClass}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {queue.title}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{queue.count}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{queue.description}</p>
            <Link className={`${secondaryButtonClass} mt-4`} href={queue.href}>
              Ouvrir la file
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
