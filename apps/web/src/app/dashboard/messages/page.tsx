import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { UnblockOrganizationButton } from '@/features/messaging/components/UnblockOrganizationButton';
import { apiFetch, apiFetchOrNull } from '@/shared/lib/api';
import { ORGANIZATION_TYPE_LABELS, formatDateTime } from '@/shared/lib/labels';
import { getSessionUser } from '@/shared/lib/session';
import {
  cardClass,
  hintTextClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { BlockedOrganization, ConversationSummary } from '@/shared/types/api';

export const metadata: Metadata = { title: 'Messagerie' };

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== 'MODELE' && user.role !== 'AGENCE')) {
    redirect('/dashboard');
  }

  const conversations = await apiFetch<ConversationSummary[]>('/conversations');
  const blocked =
    user.role === 'MODELE'
      ? ((await apiFetchOrNull<BlockedOrganization[]>('/conversations/blocked')) ?? [])
      : [];

  const conversationByOrganization = new Map(
    conversations.map((conversation) => [conversation.organizationId, conversation.id]),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Messagerie</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Les échanges restent sur la plateforme. Aucun numéro ni e-mail ne peut être partagé :
          utilisez la messagerie pour organiser vos castings.
        </p>
      </header>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
          {user.role === 'AGENCE' ? (
            <Link className={secondaryButtonClass} href="/dashboard/decouverte">
              Découvrir des modèles
            </Link>
          ) : null}
        </div>

        {conversations.length === 0 ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-600">
              {user.role === 'MODELE'
                ? 'Aucune conversation pour le moment. Une agence vérifiée peut vous contacter si votre profil est visible.'
                : 'Aucune conversation pour le moment. Contactez un modèle depuis la découverte.'}
            </p>
            {user.role === 'AGENCE' ? (
              <Link className={primaryButtonClass} href="/dashboard/decouverte">
                Aller à la découverte
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {conversations.map((conversation) => {
              const otherParty =
                user.role === 'MODELE'
                  ? conversation.organization.name
                  : conversation.profile.displayName;
              const subtitle =
                user.role === 'MODELE' ? 'Agence vérifiée' : conversation.organization.name;

              return (
                <li key={conversation.id}>
                  <Link
                    href={`/dashboard/messages/${conversation.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{otherParty}</p>
                      <p className="text-xs text-slate-500">{subtitle}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      Dernier échange : {formatDateTime(conversation.updatedAt)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {user.role === 'MODELE' ? (
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-slate-900">Organisations bloquées</h2>
          <p className={hintTextClass}>
            Une organisation bloquée ne peut plus vous contacter ni voir votre profil dans la
            découverte.
          </p>
          {blocked.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Aucune organisation bloquée.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {blocked.map((block) => {
                const conversationId = conversationByOrganization.get(block.organization.id);
                return (
                  <li
                    key={block.organization.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {block.organization.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ORGANIZATION_TYPE_LABELS[block.organization.type]} · bloquée le{' '}
                        {formatDateTime(block.blockedAt)}
                      </p>
                    </div>
                    {conversationId ? (
                      <UnblockOrganizationButton
                        conversationId={conversationId}
                        organizationName={block.organization.name}
                      />
                    ) : (
                      <span className="text-xs text-slate-500">
                        Ouvrez la conversation pour débloquer
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
