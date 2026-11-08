import { BillingInterval, SubscriptionPlan } from '@prisma/client';

export type PlanAudience = 'MODELE' | 'AGENCE';

export type BillingPlan = {
  code: SubscriptionPlan;
  name: string;
  audience: PlanAudience;
  tagline: string;
  description: string;
  /** Montant en francs CFA. `null` quand la formule n'existe pas pour ce pas. */
  prices: Record<BillingInterval, number | null>;
  features: string[];
  highlight?: boolean;
};

/**
 * Catalogue commercial. Source de vérité pour les montants : le web affiche une
 * copie marketing (apps/web/src/shared/lib/plans.ts) mais le prix facturé est
 * toujours recalculé ici, jamais accepté depuis le client.
 */
export const BILLING_PLANS: BillingPlan[] = [
  {
    code: SubscriptionPlan.MODEL_PREMIUM,
    name: 'Premium Modèle',
    audience: 'MODELE',
    tagline: 'Pour être vue, pas seulement inscrite.',
    description:
      'Un profil qui respire, des photos qui racontent, et des outils pour suivre l’intérêt réel des agences.',
    prices: { [BillingInterval.MONTHLY]: 2000, [BillingInterval.YEARLY]: 18000 },
    features: [
      '30 photos et une vidéo courte',
      'Profil mis en avant dans la découverte',
      'Candidatures aux castings illimitées',
      'Statistiques de vues et de favoris',
      'Badge Premium sur votre profil',
    ],
    highlight: true,
  },
  {
    code: SubscriptionPlan.AGENCY_STARTER,
    name: 'Agence Starter',
    audience: 'AGENCE',
    tagline: 'Le premier cercle de prospection.',
    description:
      'Pour une agence qui construit son vivier : rechercher, comparer, conserver ses sélections.',
    prices: { [BillingInterval.MONTHLY]: 15000, [BillingInterval.YEARLY]: null },
    features: [
      'Filtres avancés et listes de sélection',
      'Quota de contacts étendu',
      'Favoris et notes d’équipe',
      'Accès aux profils confirmés',
      'Support par e-mail sous 48 h',
    ],
  },
  {
    code: SubscriptionPlan.AGENCY_PRO,
    name: 'Agence Pro',
    audience: 'AGENCE',
    tagline: 'Toute la maison, sans intermédiaire.',
    description:
      'Pour une structure qui recrute en continu et veut un accès fluide à l’ensemble du catalogue.',
    prices: { [BillingInterval.MONTHLY]: 40000, [BillingInterval.YEARLY]: null },
    features: [
      'Contacts illimités',
      'Export des sélections',
      'Profils mis en avant dans vos recherches',
      'Publication de castings à l’unité incluse',
      'Accompagnement dédié',
    ],
  },
];

export const BILLING_ADDONS = [
  {
    code: 'VERIFIED_BADGE',
    name: 'Badge vérifié',
    priceFcfa: 5000,
    unit: 'une fois',
    description: 'Vérification d’identité manuelle et badge permanent sur le profil.',
  },
  {
    code: 'BOOST_7_DAYS',
    name: 'Boost 7 jours',
    priceFcfa: 1500,
    unit: '7 jours',
    description: 'Votre profil en tête des résultats de recherche pendant une semaine.',
  },
  {
    code: 'CASTING_SINGLE',
    name: 'Casting à l’unité',
    priceFcfa: 5000,
    unit: 'par casting',
    description: 'Publication d’une annonce de casting, sans abonnement.',
  },
] as const;

export function findPlan(code: SubscriptionPlan): BillingPlan | null {
  return BILLING_PLANS.find((plan) => plan.code === code) ?? null;
}

export function planPrice(code: SubscriptionPlan, interval: BillingInterval): number | null {
  return findPlan(code)?.prices[interval] ?? null;
}

export function plansForAudience(audience: PlanAudience): BillingPlan[] {
  return BILLING_PLANS.filter((plan) => plan.audience === audience);
}
