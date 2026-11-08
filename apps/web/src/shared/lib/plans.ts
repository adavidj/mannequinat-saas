import type { BillingInterval, BillingPlan } from '../types/api';

/**
 * Copie marketing du catalogue de facturation.
 * Les montants facturés sont recalculés côté API
 * (apps/api/src/modules/billing/billing.catalog.ts) : ce fichier ne sert qu'à
 * l'affichage public de la page Tarifs.
 */
export const PLAN_CATALOG: BillingPlan[] = [
  {
    code: 'MODEL_PREMIUM',
    name: 'Premium Modèle',
    audience: 'MODELE',
    tagline: 'Pour être vue, pas seulement inscrite.',
    description:
      'Un profil qui respire, des photos qui racontent, et des outils pour suivre l’intérêt réel des agences.',
    prices: { MONTHLY: 2000, YEARLY: 18000 },
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
    code: 'AGENCY_STARTER',
    name: 'Agence Starter',
    audience: 'AGENCE',
    tagline: 'Le premier cercle de prospection.',
    description:
      'Pour une agence qui construit son vivier : rechercher, comparer, conserver ses sélections.',
    prices: { MONTHLY: 15000, YEARLY: null },
    features: [
      'Filtres avancés et listes de sélection',
      'Quota de contacts étendu',
      'Favoris et notes d’équipe',
      'Accès aux profils confirmés',
      'Support par e-mail sous 48 h',
    ],
  },
  {
    code: 'AGENCY_PRO',
    name: 'Agence Pro',
    audience: 'AGENCE',
    tagline: 'Toute la maison, sans intermédiaire.',
    description:
      'Pour une structure qui recrute en continu et veut un accès fluide à l’ensemble du catalogue.',
    prices: { MONTHLY: 40000, YEARLY: null },
    features: [
      'Contacts illimités',
      'Export des sélections',
      'Profils mis en avant dans vos recherches',
      'Publication de castings à l’unité incluse',
      'Accompagnement dédié',
    ],
  },
];

export const PLAN_ADDONS = [
  {
    name: 'Badge vérifié',
    priceFcfa: 5000,
    unit: 'une fois',
    description: 'Vérification d’identité manuelle et badge permanent sur le profil.',
  },
  {
    name: 'Boost 7 jours',
    priceFcfa: 1500,
    unit: '7 jours',
    description: 'Votre profil en tête des résultats de recherche pendant une semaine.',
  },
  {
    name: 'Casting à l’unité',
    priceFcfa: 5000,
    unit: 'par casting',
    description: 'Publication d’une annonce de casting, sans abonnement.',
  },
] as const;

export const PRICING_FAQ = [
  {
    question: 'Un abonnement garantit-il un contrat ?',
    answer:
      'Non, et nous ne le dirons jamais. Un abonnement achète de la visibilité et des outils, jamais une promesse de recrutement. Toute personne qui vous promet un contrat contre de l’argent doit être signalée.',
  },
  {
    question: 'Puis-je résilier à tout moment ?',
    answer:
      'Oui. La résiliation prend effet à la fin de la période déjà payée : votre formule reste active jusqu’à cette date, puis votre profil repasse automatiquement en formule gratuite, sans perte de contenu.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      'Le paiement se fait par Mobile Money via notre agrégateur local. La carte bancaire sera ajoutée une fois l’intégration validée avec notre prestataire.',
  },
  {
    question: 'Les prix sont-ils définitifs ?',
    answer:
      'La grille affichée est la grille de lancement. Toute évolution sera annoncée avant application et ne modifiera jamais rétroactivement une période déjà payée.',
  },
  {
    question: 'Mes coordonnées de paiement sont-elles stockées ?',
    answer:
      'Jamais. Le paiement est traité par l’agrégateur ; ModelBénin ne conserve que la référence de transaction, le montant et le statut, afin d’établir votre facture et votre historique.',
  },
] as const;

export const PLAN_AUDIENCES = [
  { value: 'MODELE', label: 'Modèles', note: 'Visibilité et outils de carrière' },
  { value: 'AGENCE', label: 'Agences', note: 'Recherche et sélection de talents' },
] as const;

export function intervalUnit(interval: BillingInterval): string {
  return interval === 'YEARLY' ? 'an' : 'mois';
}
