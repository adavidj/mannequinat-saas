import { z } from 'zod';

export const moderationQueueQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export type ModerationQueueQueryDto = z.infer<typeof moderationQueueQuerySchema>;

export const moderatePhotoSchema = z.object({
  moderationStatus: z.enum(['APPROVED', 'REJECTED']),
});

export type ModeratePhotoDto = z.infer<typeof moderatePhotoSchema>;
