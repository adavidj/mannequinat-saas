import { z } from 'zod';

import { isAtLeast18 } from '../../../common/utils/age';

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
      .refine(
        (value) => !value || isAtLeast18(value),
        'Seuls les majeurs de 18 ans et plus sont autorisés sur la plateforme.',
      ),
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
  twoFactorCode: z
    .string()
    .regex(/^\d{6}$/, 'Le code de vérification doit contenir six chiffres')
    .optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const twoFactorChallengeSchema = z.object({
  challengeToken: z.string().min(1),
});

export type TwoFactorChallengeDto = z.infer<typeof twoFactorChallengeSchema>;

export const twoFactorCodeSchema = twoFactorChallengeSchema.extend({
  code: z.string().regex(/^\d{6}$/, 'Le code de vérification doit contenir six chiffres'),
});

export type TwoFactorCodeDto = z.infer<typeof twoFactorCodeSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

const passwordSchema = z
  .string()
  .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshDto = z.infer<typeof refreshSchema>;
