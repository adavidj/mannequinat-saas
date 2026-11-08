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

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type SubscriptionPlan = 'MODEL_PREMIUM' | 'AGENCY_STARTER' | 'AGENCY_PRO';

export type BillingInterval = 'MONTHLY' | 'YEARLY';

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

export type PaymentProvider = 'SIMULATED' | 'FEDAPAY' | 'KKIAPAY';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';

export type BillingPlan = {
  code: SubscriptionPlan;
  name: string;
  audience: 'MODELE' | 'AGENCE';
  tagline: string;
  description: string;
  prices: Record<BillingInterval, number | null>;
  features: string[];
  highlight?: boolean;
};

export type SubscriptionView = {
  id: string;
  plan: SubscriptionPlan;
  planName: string;
  interval: BillingInterval;
  intervalLabel: string;
  status: SubscriptionStatus;
  priceFcfa: number | null;
  startsAt: string | null;
  renewAt: string | null;
  endsAt: string | null;
  cancelAtPeriodEnd: boolean;
};

export type BillingPayment = {
  id: string;
  invoiceNumber: string | null;
  amountFcfa: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  description: string | null;
  plan: SubscriptionPlan | null;
  interval: BillingInterval | null;
  createdAt: string;
  paidAt: string | null;
};

export type BillingOverview = {
  generatedAt: string;
  simulation: boolean;
  provider: 'SIMULATED' | 'FEDAPAY';
  plans: BillingPlan[];
  subscription: SubscriptionView | null;
  payments: BillingPayment[];
  totalPayments: number;
};

export type BillingCheckoutResult = {
  payment: BillingPayment;
  checkout: {
    mode: 'simulated' | 'redirect';
    provider: PaymentProvider;
    checkoutUrl: string | null;
    reference: string;
  };
};

export type Invoice = {
  number: string;
  issuedAt: string;
  paidAt: string | null;
  status: PaymentStatus;
  amountFcfa: number;
  currency: 'XOF';
  description: string;
  planName: string | null;
  intervalLabel: string | null;
  provider: PaymentProvider;
  providerReference: string;
  customer: { email: string };
  seller: { name: string; address: string; contact: string };
  period: { startsAt: string | null; renewAt: string | null } | null;
};

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminStats = {
  generatedAt: string;
  users: {
    total: number;
    active: number;
    suspended: number;
    deleted: number;
    verified: number;
    unverified: number;
    newLast7Days: number;
    newLast30Days: number;
    byRole: Record<UserRole, number>;
  };
  profiles: {
    total: number;
    byLevel: Record<ProfileLevel, number>;
    byVisibility: Record<ProfileVisibility, number>;
  };
  photos: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  experiences: {
    total: number;
    pending: number;
    verified: number;
  };
  organizations: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  reports: {
    total: number;
    open: number;
    inReview: number;
    resolved: number;
    dismissed: number;
  };
  messaging: {
    conversations: number;
    messages: number;
    messagesLast7Days: number;
  };
  activity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    actor: { id: string; email: string; role: UserRole } | null;
  }>;
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

export type NotificationType =
  | 'WELCOME'
  | 'MESSAGE_RECEIVED'
  | 'PHOTO_APPROVED'
  | 'PHOTO_REJECTED'
  | 'EXPERIENCE_APPROVED'
  | 'EXPERIENCE_REJECTED'
  | 'ORGANIZATION_APPROVED'
  | 'ORGANIZATION_REJECTED'
  | 'REPORT_UPDATED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationList = {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  take: number;
  skip: number;
};
