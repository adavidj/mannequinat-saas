import type { Metadata } from 'next';

import { ReportQueue } from '@/features/admin/components/ReportQueue';
import { apiFetch } from '@/shared/lib/api';
import type { AdminReport, Paginated } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Signalements' };

export default async function AdminReportsPage() {
  const reports = await apiFetch<Paginated<AdminReport>>('/admin/reports?status=OPEN&take=50');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Signalements</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Les signalements restent ouverts tant qu’une décision n’a pas été prise. En cas de
          comportement grave, suspendez le compte concerné depuis la gestion des utilisateurs.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {reports.total} signalement{reports.total > 1 ? 's' : ''} ouvert
          {reports.total > 1 ? 's' : ''}.
        </p>
      </header>

      <ReportQueue initialReports={reports.items} />
    </div>
  );
}
