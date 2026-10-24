import { z } from 'zod';

export const uploadPhotoSchema = z.object({
  kind: z.enum(['PORTRAIT', 'FULL_BODY_FRONT', 'FULL_BODY_PROFILE', 'PORTFOLIO']),
  visibilityConsent: z.enum(['true']).transform(() => true),
});

export type UploadPhotoDto = z.infer<typeof uploadPhotoSchema>;
