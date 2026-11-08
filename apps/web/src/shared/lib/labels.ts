import type {
  BillingInterval,
  ModerationStatus,
  OrganizationType,
  PaymentProvider,
  PaymentStatus,
  PhotoKind,
  ProfileLevel,
  ProfileVisibility,
  ReportStatus,
  ReportTargetType,
  SubscriptionStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../types/api';

export const ROLE_LABELS: Record<UserRole, string> = {
  MODELE: 'Modèle',
  AGENCE: 'Agence',
  FORMATEUR: 'Organisme de formation',
  ADMIN: 'Administrateur',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  DELETED: 'Supprimé',
};

export const USER_STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-800 ring-red-200',
  DELETED: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: 'En attente de paiement',
  ACTIVE: 'Actif',
  PAST_DUE: 'Impayé',
  CANCELED: 'Résilié',
  EXPIRED: 'Expiré',
};

export const SUBSCRIPTION_STATUS_STYLES: Record<SubscriptionStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  PAST_DUE: 'bg-orange-50 text-orange-800 ring-orange-200',
  CANCELED: 'bg-slate-100 text-slate-700 ring-slate-200',
  EXPIRED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  SUCCEEDED: 'Payé',
  FAILED: 'Échoué',
  CANCELED: 'Annulé',
  REFUNDED: 'Remboursé',
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  SUCCEEDED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  FAILED: 'bg-red-50 text-red-800 ring-red-200',
  CANCELED: 'bg-slate-100 text-slate-700 ring-slate-200',
  REFUNDED: 'bg-sky-50 text-sky-800 ring-sky-200',
};

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  SIMULATED: 'Paiement simulé',
  FEDAPAY: 'FedaPay · Mobile Money',
  KKIAPAY: 'KKiaPay · Mobile Money',
};

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel',
};

export const BILLING_INTERVAL_SHORT_LABELS: Record<BillingInterval, string> = {
  MONTHLY: 'mois',
  YEARLY: 'an',
};

export function formatFcfa(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

export const PROFILE_LEVEL_LABELS: Record<ProfileLevel, string> = {
  DEBUTANT: 'Débutant',
  CONFIRME: 'Confirmé',
};

export const VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  PRIVATE: 'Privé',
  VERIFIED_AGENCIES: 'Agences vérifiées',
  PUBLIC: 'Public',
};

export const MODERATION_LABELS: Record<ModerationStatus, string> = {
  PENDING: 'En attente de modération',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
};

export const MODERATION_STYLES: Record<ModerationStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 ring-red-200',
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  AGENCY: 'Agence',
  RECRUITER: 'Recruteur',
  TRAINING_ORGANIZATION: 'Organisme de formation',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'En attente de vérification',
  VERIFIED: 'Vérifiée',
  REJECTED: 'Refusée',
};

export const VERIFICATION_STYLES: Record<VerificationStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 ring-red-200',
};

export const PHOTO_KIND_LABELS: Record<PhotoKind, string> = {
  PORTRAIT: 'Portrait',
  FULL_BODY_FRONT: 'Plein pied — face',
  FULL_BODY_PROFILE: 'Plein pied — profil',
  PORTFOLIO: 'Portfolio',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'Ouvert',
  IN_REVIEW: 'En cours',
  RESOLVED: 'Résolu',
  DISMISSED: 'Classé sans suite',
};

export const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  OPEN: 'bg-red-50 text-red-800 ring-red-200',
  IN_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  DISMISSED: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  USER: 'Compte',
  PROFILE: 'Profil',
  ORGANIZATION: 'Organisation',
  CONVERSATION: 'Conversation',
  MESSAGE: 'Message',
  PHOTO: 'Photo',
};

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
