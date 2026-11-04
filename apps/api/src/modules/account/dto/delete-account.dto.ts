import { z } from 'zod';

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Le mot de passe est obligatoire.')
    .max(200, 'Mot de passe trop long.'),
  confirmation: z
    .string()
    .trim()
    .refine(
      (value): boolean => value === 'SUPPRIMER',
      'Saisissez exactement SUPPRIMER pour confirmer la suppression.',
    ),
});

export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;
