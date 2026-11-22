import type { BillingInterval, BillingPlan } from '../types/api';

/**
 * Copie marketing du catalogue de facturation.
 * Les montants facturés sont recalculés côté API
 * (apps/api/src/modules/billing/billing.catalog.ts) : ce fichier ne sert qu'à
 * l'affichage public de la page Tarifs.
 *
 * Tant que les entitlements (lot 3) ne sont pas livrés, aucune formule n'est
 * achetable : chaque avantage est marqué comme disponible (déjà livré) ou
 * « bientôt » (promis mais absent). Ne jamais passer `available` à `true` pour
 * une formule dont les contreparties ne sont pas réellement appliquées.
 */

export type PlanFeature = {
  label: string;
  /** `true` seulement si la fonctionnalité existe déjà dans le produit. */
  available: boolean;
};

export type PlanDisplay = Omit<BillingPlan, 'features'> & {
  features: PlanFeature[];
  /** `false` : la formule est présentée mais ne peut pas être souscrite. */
  available: boolean;
};

export const PLAN_CATALOG: PlanDisplay[] = [
  {
    code: 'MODEL_PREMIUM',
    name: 'Premium Modèle',
    audience: 'MODELE',
    tagline: 'Pour être vue, pas seulement inscrite.',
    description:
      'Un profil qui respire, des photos qui racontent, et des outils pour suivre l’intérêt réel des agences.',
    prices: { MONTHLY: 2000, YEARLY: 18000 },
    available: false,
    features: [
      { label: 'Profil complet et trois photos guidées modérées', available: true },
      { label: 'Messagerie tracée, blocable et signalable', available: true },
      { label: '30 photos et une vidéo courte', available: false },
      { label: 'Profil mis en avant dans la découverte', available: false },
      { label: 'Candidatures aux castings illimitées', available: false },
      { label: 'Statistiques de vues et de favoris', available: false },
      { label: 'Badge Premium sur votre profil', available: false },
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
    available: false,
    features: [
      { label: 'Découverte réservée aux agences vérifiées', available: true },
      { label: 'Messagerie encadrée, quota et blocage', available: true },
      { label: 'Filtres avancés et listes de sélection', available: false },
      { label: 'Quota de contacts étendu', available: false },
      { label: 'Favoris et notes d’équipe', available: false },
      { label: 'Accès aux profils confirmés', available: false },
      { label: 'Support par e-mail sous 48 h', available: false },
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
    available: false,
    features: [
      { label: 'Découverte réservée aux agences vérifiées', available: true },
      { label: 'Messagerie encadrée, quota et blocage', available: true },
      { label: 'Contacts illimités', available: false },
      { label: 'Export des sélections', available: false },
      { label: 'Publication de castings à l’unité incluse', available: false },
      { label: 'Accompagnement dédié', available: false },
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
    question: 'Puis-je souscrire une formule aujourd’hui ?',
    answer:
      'Non. Aucun paiement n’est ouvert : les contreparties payantes (photos supplémentaires, castings, filtres, statistiques, badge) ne sont pas encore livrées. La grille ci-dessous décrit ce qui sera inclus, avec les éléments déjà disponibles et ceux marqués « bientôt ».',
  },
  {
    question: 'Un abonnement garantit-il un contrat ?',
    answer:
      'Non, et nous ne le dirons jamais. Un abonnement achètera de la visibilité et des outils, jamais une promesse de recrutement. Toute personne qui vous promet un contrat contre de l’argent doit être signalée.',
  },
  {
    question: 'Puis-je résilier à tout moment ?',
    answer:
      'Oui, dès que les formules seront ouvertes. La résiliation prendra effet à la fin de la période déjà payée : votre formule restera active jusqu’à cette date, puis votre profil repassera automatiquement en formule gratuite, sans perte de contenu.',
  },
  {
    question: 'Quels moyens de paiement accepterez-vous ?',
    answer:
      'Le paiement se fera par Mobile Money via notre agrégateur local. L’ouverture dépendra de la livraison des contreparties, pas seulement de l’intégration technique.',
  },
  {
    question: 'Mes coordonnées de paiement sont-elles stockées ?',
    answer:
      'Jamais. Le paiement sera traité par l’agrégateur ; ModelBénin ne conservera que la référence de transaction, le montant et le statut, afin d’établir votre facture et votre historique.',
  },
] as const;

export const PLAN_AUDIENCES = [
  { value: 'MODELE', label: 'Modèles', note: 'Visibilité et outils de carrière' },
  { value: 'AGENCE', label: 'Agences', note: 'Recherche et sélection de talents' },
] as const;

export function intervalUnit(interval: BillingInterval): string {
  return interval === 'YEARLY' ? 'an' : 'mois';
}
