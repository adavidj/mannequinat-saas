import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: z.enum(['MODELE', 'AGENCE', 'FORMATEUR', 'ADMIN']),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
