export type UserRole = 'MODELE' | 'AGENCE' | 'FORMATEUR' | 'ADMIN';

export type ProfileLevel = 'DEBUTANT' | 'CONFIRME';

export type ProfileVisibility = 'PRIVATE' | 'VERIFIED_AGENCIES' | 'PUBLIC';

export type PhotoKind = 'PORTRAIT' | 'FULL_BODY_FRONT' | 'FULL_BODY_PROFILE' | 'PORTFOLIO';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type OrganizationType = 'AGENCY' | 'RECRUITER' | 'TRAINING_ORGANIZATION';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type OwnedOrganization = {
  id: string;
  type: OrganizationType;
  name: string;
  ifu: string | null;
  rccm: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  take: number;
  skip: number;
};

export type AdminOrganization = OwnedOrganization & {
  owner: { id: string; email: string };
};

export type AdminPhoto = OwnedPhotoWithUrl & {
  profile: { id: string; displayName: string; city: string };
};

export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type ReportTargetType =
  'USER' | 'PROFILE' | 'ORGANIZATION' | 'CONVERSATION' | 'MESSAGE' | 'PHOTO';

export type AdminReport = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; email: string; role: UserRole };
};

export type DiscoveryPhoto = {
  id: string;
  kind: PhotoKind;
  url: string;
  urlExpiresAt: string;
};

export type DiscoveryModel = {
  id: string;
  displayName: string;
  city: string;
  level: ProfileLevel;
  bio: string | null;
  photos: DiscoveryPhoto[];
};

export type ConversationSummary = {
  id: string;
  organizationId: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  organization: { id: string; name: string };
  profile: { id: string; displayName: string };
};

export type ConversationMessage = {
  id: string;
  senderId: string;
  body: string;
  sentAt: string;
};

export type BlockedOrganization = {
  organization: { id: string; name: string; type: OrganizationType };
  blockedAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: SessionUser;
  emailVerificationToken?: string;
  message?: string;
};

export type ModelProfile = {
  id: string;
  level: ProfileLevel;
  displayName: string;
  birthDate: string;
  city: string;
  heightCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  shoeSize: number | null;
  visibility: ProfileVisibility;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnedPhoto = {
  id: string;
  kind: PhotoKind;
  moderationStatus: ModerationStatus;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  visibilityConsent: ProfileVisibility;
  visibilityConsentAt: string;
  createdAt: string;
};

export type OwnedPhotoWithUrl = OwnedPhoto & {
  signedUrl: string;
  signedUrlExpiresAt: string;
};

export type OwnedExperience = {
  id: string;
  title: string;
  org: string;
  startDate: string;
  endDate: string | null;
  verified: boolean;
  hasProof: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminExperience = OwnedExperience & {
  profile: {
    id: string;
    displayName: string;
    city: string;
    user: { email: string };
  };
};
