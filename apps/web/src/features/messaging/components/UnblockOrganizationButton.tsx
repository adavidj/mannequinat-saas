'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { dangerButtonClass } from '@/shared/lib/ui';

export function UnblockOrganizationButton({
  conversationId,
  organizationName,
}: {
  conversationId: string;
  organizationName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unblock() {
    if (
      !window.confirm(
        `Débloquer « ${organizationName} » ? Cette organisation pourra à nouveau vous contacter.`,
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await browserApi<void>(`/conversations/${conversationId}/block`, { method: 'DELETE' });
      router.refresh();
    } catch (unblockError) {
      setError(browserApiMessage(unblockError));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        className={dangerButtonClass}
        onClick={() => void unblock()}
        disabled={pending}
      >
        {pending ? 'Déblocage…' : 'Débloquer'}
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
