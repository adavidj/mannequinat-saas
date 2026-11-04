'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { browserApi, browserApiMessage } from '@/shared/lib/browser-api';
import { formatDateTime } from '@/shared/lib/labels';
import {
  alertErrorClass,
  alertInfoClass,
  alertSuccessClass,
  dangerButtonClass,
  hintTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/shared/lib/ui';
import type { ConversationMessage, ConversationSummary, UserRole } from '@/shared/types/api';

type ConversationThreadProps = {
  conversation: ConversationSummary;
  initialMessages: ConversationMessage[];
  currentUserId: string;
  role: UserRole;
  initiallyBlocked: boolean;
};

export function ConversationThread({
  conversation,
  initialMessages,
  currentUserId,
  role,
  initiallyBlocked,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [blockPending, setBlockPending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportPending, setReportPending] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const otherParty =
    role === 'MODELE' ? conversation.organization.name : conversation.profile.displayName;
  const canSend = !(role === 'MODELE' && blocked);

  async function refreshMessages() {
    try {
      const next = await browserApi<ConversationMessage[]>(
        `/conversations/${conversation.id}/messages`,
      );
      setMessages(next);
    } catch {
      // Un échec de rafraîchissement ne doit pas interrompre la saisie.
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshMessages();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const message = await browserApi<ConversationMessage>(
        `/conversations/${conversation.id}/messages`,
        { method: 'POST', body: JSON.stringify({ body: trimmed }) },
      );
      setMessages((current) => [...current, message]);
      setBody('');
    } catch (sendError) {
      setError(browserApiMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  async function toggleBlock() {
    const action = blocked ? 'Débloquer' : 'Bloquer';
    if (!window.confirm(`${action} « ${conversation.organization.name} » ?`)) {
      return;
    }
    setBlockPending(true);
    setError(null);
    setNotice(null);
    try {
      if (blocked) {
        await browserApi<void>(`/conversations/${conversation.id}/block`, { method: 'DELETE' });
        setBlocked(false);
        setNotice('Organisation débloquée.');
      } else {
        await browserApi<void>(`/conversations/${conversation.id}/block`, { method: 'POST' });
        setBlocked(true);
        setNotice('Organisation bloquée. Elle ne peut plus vous contacter.');
      }
    } catch (blockError) {
      setError(browserApiMessage(blockError));
    } finally {
      setBlockPending(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reportReason.trim().length < 10) {
      setError('Décrivez le problème en au moins 10 caractères.');
      return;
    }
    setReportPending(true);
    setError(null);
    try {
      await browserApi<{ id: string }>(`/conversations/${conversation.id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      setReportDone(true);
      setReportOpen(false);
      setReportReason('');
    } catch (reportError) {
      setError(browserApiMessage(reportError));
    } finally {
      setReportPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{otherParty}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {role === 'MODELE' ? 'Agence vérifiée' : conversation.organization.name} · conversation
            ouverte le {formatDateTime(conversation.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'MODELE' ? (
            <button
              type="button"
              className={blocked ? secondaryButtonClass : dangerButtonClass}
              onClick={() => void toggleBlock()}
              disabled={blockPending}
            >
              {blockPending ? 'Traitement…' : blocked ? 'Débloquer' : 'Bloquer'}
            </button>
          ) : null}
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setReportOpen((open) => !open)}
            disabled={reportDone}
          >
            {reportDone ? 'Signalement envoyé' : 'Signaler'}
          </button>
        </div>
      </header>

      {blocked ? (
        <p className={alertInfoClass}>
          Vous avez bloqué cette organisation. Elle ne peut plus envoyer de messages. Débloquez-la
          pour reprendre la conversation.
        </p>
      ) : null}

      {error ? (
        <p className={alertErrorClass} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className={alertSuccessClass}>{notice}</p> : null}

      {reportOpen ? (
        <form
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
          onSubmit={submitReport}
        >
          <div>
            <label className={labelClass} htmlFor="report-reason">
              Motif du signalement
            </label>
            <textarea
              id="report-reason"
              className={inputClass}
              rows={3}
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder="Décrivez le comportement problématique…"
            />
            <p className={hintTextClass}>
              Le signalement est transmis à notre équipe de modération. Restez factuel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primaryButtonClass} disabled={reportPending}>
              {reportPending ? 'Envoi…' : 'Envoyer le signalement'}
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setReportOpen(false)}
              disabled={reportPending}
            >
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      <section className="flex h-[28rem] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun message. Écrivez le premier.</p>
          ) : (
            messages.map((message) => {
              const own = message.senderId === currentUserId;
              return (
                <div key={message.id} className={own ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                      own ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {message.body}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {own ? 'Vous' : otherParty} · {formatDateTime(message.sentAt)}
                  </p>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form className="border-t border-slate-200 p-3" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="message-body">
            Votre message
          </label>
          <textarea
            id="message-body"
            className={inputClass}
            rows={2}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={canSend ? 'Votre message…' : 'Débloquez l’organisation pour répondre.'}
            disabled={!canSend || sending}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Les numéros et adresses e-mail sont automatiquement bloqués.
            </p>
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={!canSend || sending || body.trim().length === 0}
            >
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
