'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ArrowRightIcon, CheckIcon, SparkIcon } from '@/shared/components/icons';
import { formatFcfa } from '@/shared/lib/labels';
import { PLAN_AUDIENCES, PLAN_CATALOG, intervalUnit } from '@/shared/lib/plans';
import type { BillingInterval } from '@/shared/types/api';

type Audience = 'MODELE' | 'AGENCE';

export function PricingBoard() {
  const [audience, setAudience] = useState<Audience>('MODELE');
  const [interval, setInterval] = useState<BillingInterval>('MONTHLY');

  const plans = PLAN_CATALOG.filter((plan) => plan.audience === audience);
  const yearlyAvailable = plans.some((plan) => plan.prices.YEARLY !== null);

  function selectAudience(next: Audience) {
    setAudience(next);
    if (next === 'AGENCE') {
      setInterval('MONTHLY');
    }
  }

  return (
    <div>
      <div className="flex flex-col items-center gap-7">
        <div
          role="tablist"
          aria-label="Choisir un public"
          className="inline-flex rounded-full border border-ink-900/15 bg-white p-1"
        >
          {PLAN_AUDIENCES.map((item) => {
            const active = audience === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectAudience(item.value)}
                className={`rounded-full px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300 ${
                  active ? 'bg-ink-950 text-ivory-50' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {yearlyAvailable ? (
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest">
              <button
                type="button"
                aria-pressed={interval === 'MONTHLY'}
                onClick={() => setInterval('MONTHLY')}
                className={interval === 'MONTHLY' ? 'text-ink-950' : 'text-ink-400'}
              >
                Mensuel
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={interval === 'YEARLY'}
                aria-label="Basculer entre paiement mensuel et annuel"
                onClick={() => setInterval(interval === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                className="relative h-7 w-14 rounded-full border border-ink-900/15 bg-ivory-200 transition-colors duration-300"
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-ink-950 transition-all duration-300 ${
                    interval === 'YEARLY' ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
              <button
                type="button"
                aria-pressed={interval === 'YEARLY'}
                onClick={() => setInterval('YEARLY')}
                className={interval === 'YEARLY' ? 'text-ink-950' : 'text-ink-400'}
              >
                Annuel
              </button>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-gold-700">
              Trois mois offerts sur l’engagement annuel
            </p>
          </div>
        ) : (
          <p className="text-[10px] uppercase tracking-widest text-ink-400">
            Facturation mensuelle · sans engagement
          </p>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
        <strong>Aucun paiement n’est ouvert.</strong> Les formules ci-dessous décrivent ce qui sera
        inclus. Les éléments marqués « Bientôt » ne sont pas encore livrés : ne souscrivez rien avant
        leur ouverture officielle.
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => {
          const yearly = interval === 'YEARLY' ? plan.prices.YEARLY : null;
          const monthlyEquivalent =
            interval === 'YEARLY' && yearly ? Math.round(yearly / 12) : null;
          const price = yearly ?? plan.prices.MONTHLY ?? 0;
          const highlighted = Boolean(plan.highlight);

          return (
            <article
              key={plan.code}
              className={`group relative flex flex-col overflow-hidden rounded-[2px] p-8 transition-transform duration-500 hover:-translate-y-1 sm:p-10 ${
                highlighted
                  ? 'bg-ink-950 text-ivory-50 shadow-lift'
                  : 'border border-ink-900/10 bg-white text-ink-950'
              }`}
            >
              {highlighted ? (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-700/20 blur-[90px]"
                  />
                  <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-gold-300 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-ink-950">
                    <SparkIcon className="h-3 w-3" />
                    Recommandé
                  </span>
                </>
              ) : null}

              <p
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  highlighted ? 'text-gold-400' : 'text-gold-700'
                }`}
              >
                {plan.audience === 'MODELE' ? 'Modèle' : 'Agence'}
              </p>
              <h3 className="mt-4 font-display text-3xl font-light tracking-tight">{plan.name}</h3>
              <p
                className={`mt-2 text-sm leading-6 ${
                  highlighted ? 'text-ivory-100/60' : 'text-ink-500'
                }`}
              >
                {plan.tagline}
              </p>

              <div className="mt-8 flex items-end gap-2">
                <span className="font-display text-5xl font-light leading-none tracking-tight">
                  {new Intl.NumberFormat('fr-FR').format(price)}
                </span>
                <span
                  className={`pb-1 text-[11px] font-semibold uppercase tracking-widest ${
                    highlighted ? 'text-ivory-100/50' : 'text-ink-500'
                  }`}
                >
                  FCFA / {intervalUnit(interval)}
                </span>
              </div>
              {monthlyEquivalent ? (
                <p className={`mt-2 text-xs ${highlighted ? 'text-gold-200/80' : 'text-gold-700'}`}>
                  soit {formatFcfa(monthlyEquivalent)} par mois
                </p>
              ) : (
                <p className={`mt-2 text-xs ${highlighted ? 'text-ivory-100/35' : 'text-ink-400'}`}>
                  {plan.available
                    ? interval === 'YEARLY'
                      ? 'Facturation annuelle'
                      : 'Résiliable à tout moment'
                    : 'Prix de lancement — non facturé aujourd’hui'}
                </p>
              )}

              <ul className="mt-8 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-3 text-sm leading-6">
                    {feature.available ? (
                      <CheckIcon
                        className={`mt-1 h-3.5 w-3.5 shrink-0 ${
                          highlighted ? 'text-gold-300' : 'text-gold-600'
                        }`}
                      />
                    ) : (
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                          highlighted
                            ? 'bg-white/10 text-ivory-100/70'
                            : 'bg-ink-900/[0.06] text-ink-500'
                        }`}
                      >
                        Bientôt
                      </span>
                    )}
                    <span
                      className={
                        feature.available
                          ? highlighted
                            ? 'text-ivory-100/75'
                            : 'text-ink-600'
                          : highlighted
                            ? 'text-ivory-100/40'
                            : 'text-ink-400'
                      }
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 pt-2">
                {plan.available ? (
                  <Link
                    href="/inscription"
                    className={`btn-shine group/cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                      highlighted
                        ? 'bg-gold-300 text-ink-950 hover:bg-gold-200'
                        : 'bg-ink-950 text-ivory-50 hover:bg-brand-900'
                    }`}
                  >
                    Choisir {plan.name}
                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={`inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest ${
                      highlighted
                        ? 'bg-white/10 text-ivory-100/50'
                        : 'border border-ink-900/15 bg-ink-900/[0.04] text-ink-500'
                    }`}
                  >
                    Bientôt disponible
                  </span>
                )}
                <Link
                  href="/inscription"
                  className={`text-center text-[10px] font-semibold uppercase tracking-widest underline decoration-1 underline-offset-4 transition-colors ${
                    highlighted
                      ? 'text-ivory-100/45 hover:text-gold-200'
                      : 'text-ink-400 hover:text-gold-700'
                  }`}
                >
                  {plan.available ? 'Déjà membre ? Gérer mon abonnement' : 'Créer mon profil gratuit'}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs leading-6 text-ink-400">
        Sans engagement. Les formules seront résiliables en un clic depuis votre espace, avec effet à
        la fin de la période payée. Aucun moyen de paiement n’est demandé aujourd’hui.
      </p>
    </div>
  );
}
