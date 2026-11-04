'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { alertErrorClass, primaryButtonClass, secondaryButtonClass } from '@/shared/lib/ui';

export function ContactModelButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function contact() {
    setPending(true);
    setError(null);
    try {
      const conversation = await browserApi<{ id: string }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ profileId }),
      });
      router.push(`/dashboard/messages/${conversation.id}`);
    } catch (contactError) {
      setError(browserApiMessage(contactError));
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={`${primaryButtonClass} w-full`}
        onClick={() => void contact()}
        disabled={pending}
      >
        {pending ? 'Ouverture…' : 'Contacter ce modèle'}
      </button>
      {error ? <p className={alertErrorClass}>{error}</p> : null}
      <p className="text-center text-[11px] text-slate-500">
        Les coordonnées personnelles sont filtrées : la conversation reste sur la plateforme.
      </p>
      <noscript>
        <span className={secondaryButtonClass}>Activez JavaScript pour contacter un modèle.</span>
      </noscript>
    </div>
  );
}
