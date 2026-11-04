import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ConversationThread } from '@/features/messaging/components/ConversationThread';
import { apiFetch, apiFetchOrNull } from '@/shared/lib/api';
import { getSessionUser } from '@/shared/lib/session';
import { cardClass, secondaryButtonClass } from '@/shared/lib/ui';
import type {
  BlockedOrganization,
  ConversationMessage,
  ConversationSummary,
} from '@/shared/types/api';

export const metadata: Metadata = { title: 'Conversation' };

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  const user = await getSessionUser();
  if (!user || (user.role !== 'MODELE' && user.role !== 'AGENCE')) {
    redirect('/dashboard');
  }

  const conversations = await apiFetch<ConversationSummary[]>('/conversations');
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    notFound();
  }

  const [messages, blockedOrganizations] = await Promise.all([
    apiFetch<ConversationMessage[]>(`/conversations/${conversation.id}/messages`),
    user.role === 'MODELE'
      ? apiFetchOrNull<BlockedOrganization[]>('/conversations/blocked')
      : Promise.resolve(null),
  ]);

  const blocked = Boolean(
    blockedOrganizations?.some((item) => item.organization.id === conversation.organizationId),
  );

  return (
    <div className="space-y-4">
      <Link className={secondaryButtonClass} href="/dashboard/messages">
        ← Toutes les conversations
      </Link>
      <div className={cardClass}>
        <ConversationThread
          conversation={conversation}
          initialMessages={messages}
          currentUserId={user.id}
          role={user.role}
          initiallyBlocked={blocked}
        />
      </div>
    </div>
  );
}
