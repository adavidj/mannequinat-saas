import { z } from 'zod';

import { isAtLeast18 } from '@/shared/lib/age';
import type { ModelProfile } from '@/shared/types/api';

const optionalMeasurement = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' || (/^\d{1,3}$/.test(value) && Number(value) >= 1 && Number(value) <= 300),
    'Valeur attendue entre 1 et 300.',
  );

const birthDateSchema = z
  .string()
  .min(1, 'La date de naissance est obligatoire.')
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), 'Format attendu : AAAA-MM-JJ.')
  .refine((value) => isAtLeast18(value), 'La plateforme est réservée aux 18 ans et plus.');

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Le nom affiché doit contenir au moins 2 caractères.')
    .max(100, '100 caractères maximum.'),
  birthDate: birthDateSchema,
  city: z
    .string()
    .trim()
    .min(2, 'La ville doit contenir au moins 2 caractères.')
    .max(100, '100 caractères maximum.'),
  heightCm: optionalMeasurement,
  chestCm: optionalMeasurement,
  waistCm: optionalMeasurement,
  hipsCm: optionalMeasurement,
  shoeSize: optionalMeasurement,
  bio: z.string().trim().max(2_000, '2 000 caractères maximum.'),
  visibility: z.enum(['PRIVATE', 'VERIFIED_AGENCIES', 'PUBLIC']),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

const MEASUREMENT_KEYS = ['heightCm', 'chestCm', 'waistCm', 'hipsCm', 'shoeSize'] as const;

export function profileToFormValues(profile: ModelProfile | null): ProfileFormValues {
  return {
    displayName: profile?.displayName ?? '',
    birthDate: profile?.birthDate ?? '',
    city: profile?.city ?? '',
    heightCm: profile?.heightCm?.toString() ?? '',
    chestCm: profile?.chestCm?.toString() ?? '',
    waistCm: profile?.waistCm?.toString() ?? '',
    hipsCm: profile?.hipsCm?.toString() ?? '',
    shoeSize: profile?.shoeSize?.toString() ?? '',
    bio: profile?.bio ?? '',
    visibility: profile?.visibility ?? 'PRIVATE',
  };
}

export function formValuesToPayload(values: ProfileFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    displayName: values.displayName,
    birthDate: values.birthDate,
    city: values.city,
    visibility: values.visibility,
    bio: values.bio.trim(),
  };

  for (const key of MEASUREMENT_KEYS) {
    const raw = values[key];
    if (raw !== '') {
      payload[key] = Number(raw);
    }
  }

  return payload;
}
