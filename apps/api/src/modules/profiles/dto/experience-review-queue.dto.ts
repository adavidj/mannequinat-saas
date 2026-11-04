import { z } from 'zod';

export const experienceReviewQueueQuerySchema = z.object({
  verified: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export type ExperienceReviewQueueQueryDto = z.infer<typeof experienceReviewQueueQuerySchema>;
