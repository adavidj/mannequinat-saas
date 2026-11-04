'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_STYLES,
  REPORT_TARGET_LABELS,
  formatDateTime,
} from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertSuccessClass,
  badgeClass,
  cardClass,
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { AdminReport, ReportStatus } from '@/shared/types/api';

export function ReportQueue({ initialReports }: { initialReports: AdminReport[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function updateStatus(report: AdminReport, status: Exclude<ReportStatus, 'OPEN'>) {
    setPendingId(report.id);
    setError(null);
    setNotice(null);
    try {
      await browserApi(`/admin/reports/${report.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReports((current) => current.filter((item) => item.id !== report.id));
      setNotice(`Signalement ${REPORT_STATUS_LABELS[status].toLowerCase()}.`);
      router.refresh();
    } catch (updateError) {
      setError(browserApiMessage(updateError));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className={alertErrorClass} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className={alertSuccessClass}>{notice}</p> : null}

      {reports.length === 0 ? (
        <p className={cardClass}>Aucun signalement ouvert. Tout est traité.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">
                      {REPORT_TARGET_LABELS[report.targetType]}
                    </h2>
                    <span className={`${badgeClass} ${REPORT_STATUS_STYLES[report.status]}`}>
                      {REPORT_STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Par {report.reporter.email} ({report.reporter.role}) ·{' '}
                    {formatDateTime(report.createdAt)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-400">{report.targetId}</p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {report.reason}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => void updateStatus(report, 'IN_REVIEW')}
                  disabled={pendingId === report.id}
                >
                  Prendre en charge
                </button>
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={() => void updateStatus(report, 'RESOLVED')}
                  disabled={pendingId === report.id}
                >
                  Résoudre
                </button>
                <button
                  type="button"
                  className={dangerButtonClass}
                  onClick={() => void updateStatus(report, 'DISMISSED')}
                  disabled={pendingId === report.id}
                >
                  Classer sans suite
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
