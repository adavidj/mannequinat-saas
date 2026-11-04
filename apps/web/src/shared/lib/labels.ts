import type {
  ModerationStatus,
  OrganizationType,
  ProfileLevel,
  ProfileVisibility,
  UserRole,
  VerificationStatus,
} from '../types/api';

export const ROLE_LABELS: Record<UserRole, string> = {
  MODELE: 'Modèle',
  AGENCE: 'Agence',
  FORMATEUR: 'Organisme de formation',
  ADMIN: 'Administrateur',
};

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
