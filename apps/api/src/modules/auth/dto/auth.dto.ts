import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    role: z.enum(['MODELE', 'AGENCE', 'FORMATEUR']),
    birthDate: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) {
          return true;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return false;
        }
        const now = new Date();
        let age = now.getFullYear() - date.getFullYear();
        const month = now.getMonth() - date.getMonth();
        if (month < 0 || (month === 0 && now.getDate() < date.getDate())) {
          age -= 1;
        }
        return age >= 18;
      }, 'Seuls les majeurs de 18 ans et plus sont autorisés sur la plateforme.'),
  })
  .refine(
    (data) => {
      if (data.role === 'MODELE') {
        return Boolean(data.birthDate);
      }
      return true;
    },
    { message: 'La date de naissance est obligatoire pour un compte modèle.', path: ['birthDate'] },
  );

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshDto = z.infer<typeof refreshSchema>;
