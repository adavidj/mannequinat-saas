import { z } from 'zod';

export const listUsersSchema = z.object({
  role: z.enum(['MODELE', 'AGENCE', 'FORMATEUR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  q: z.string().trim().min(2).max(100).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export type ListUsersDto = z.infer<typeof listUsersSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
