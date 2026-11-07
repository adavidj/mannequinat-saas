import { z } from 'zod';

import { isAtLeast18 } from '@/shared/lib/age';

export const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().trim().email('Adresse e-mail invalide.'),
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule.')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule.')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.'),
    role: z.enum(['MODELE', 'AGENCE', 'FORMATEUR'], {
      message: 'Choisissez un type de compte.',
    }),
    birthDate: z.string().optional(),
  })
  .refine((data) => data.role !== 'MODELE' || Boolean(data.birthDate), {
    message: 'La date de naissance est obligatoire pour un compte modèle.',
    path: ['birthDate'],
  })
  .refine(
    (data) => {
      if (!data.birthDate) {
        return true;
      }
      return /^\d{4}-\d{2}-\d{2}$/.test(data.birthDate) && isAtLeast18(data.birthDate);
    },
    {
      message: 'Seuls les majeurs de 18 ans et plus sont autorisés sur la plateforme.',
      path: ['birthDate'],
    },
  );

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Le jeton de vérification est obligatoire.'),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'Le mot de passe doit contenir au moins 10 caractères.')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule.')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule.')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.'),
    confirmPassword: z.string().min(1, 'Confirmez votre mot de passe.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
