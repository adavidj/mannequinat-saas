import { z } from 'zod';

export const deleteAccountFormSchema = z.object({
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
  confirmation: z
    .string()
    .trim()
    .refine(
      (value): boolean => value === 'SUPPRIMER',
      'Saisissez exactement SUPPRIMER pour confirmer la suppression.',
    ),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>;
