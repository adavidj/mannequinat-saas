import { z } from 'zod';

export const reviewQueueQuerySchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export type ReviewQueueQueryDto = z.infer<typeof reviewQueueQuerySchema>;
