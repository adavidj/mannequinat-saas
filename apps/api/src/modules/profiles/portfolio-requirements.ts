import { PhotoKind } from '@prisma/client';

export const REQUIRED_GUIDED_PHOTO_KINDS = [
  PhotoKind.PORTRAIT,
  PhotoKind.FULL_BODY_FRONT,
  PhotoKind.FULL_BODY_PROFILE,
] as const;

export function hasApprovedGuidedPortfolio(photoKinds: readonly PhotoKind[]): boolean {
  return REQUIRED_GUIDED_PHOTO_KINDS.every((kind) => photoKinds.includes(kind));
}
