import { z } from 'zod';

export const searchModelsSchema = z.object({
  organizationId: z.string().cuid().optional(),
  city: z.string().trim().min(2).max(100).optional(),
  level: z.enum(['DEBUTANT', 'CONFIRME']).optional(),
  q: z.string().trim().min(2).max(100).optional(),
  take: z.coerce.number().int().min(1).max(50).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

export type SearchModelsDto = z.infer<typeof searchModelsSchema>;
