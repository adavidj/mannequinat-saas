import { z } from 'zod';

export const createCheckoutSchema = z.object({
  plan: z.enum(['MODEL_PREMIUM', 'AGENCY_STARTER', 'AGENCY_PRO']),
  interval: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
});

export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;

export const paymentListQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(50).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

export type PaymentListQueryDto = z.infer<typeof paymentListQuerySchema>;
