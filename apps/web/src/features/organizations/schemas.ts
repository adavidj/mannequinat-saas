import { z } from 'zod';

import type { OrganizationType, UserRole } from '@/shared/types/api';

const optionalIdentifier = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || value.length >= 3,
    'Le numéro doit contenir au moins 3 caractères.',
  )
  .refine((value) => value === '' || value.length <= 100, '100 caractères maximum.');

export const organizationFormSchema = z
  .object({
    type: z.enum(['AGENCY', 'RECRUITER', 'TRAINING_ORGANIZATION']),
    name: z
      .string()
      .trim()
      .min(2, 'Le nom doit contenir au moins 2 caractères.')
      .max(150, '150 caractères maximum.'),
    ifu: optionalIdentifier,
    rccm: optionalIdentifier,
  })
  .refine((data) => Boolean(data.ifu || data.rccm), {
    message: 'Renseignez au moins un numéro IFU ou RCCM.',
    path: ['ifu'],
  });

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export function organizationTypesForRole(role: UserRole): OrganizationType[] {
  if (role === 'FORMATEUR') {
    return ['TRAINING_ORGANIZATION'];
  }
  return ['AGENCY', 'RECRUITER'];
}

export function organizationToPayload(values: OrganizationFormValues): Record<string, unknown> {
  return {
    type: values.type,
    name: values.name,
    ...(values.ifu ? { ifu: values.ifu } : {}),
    ...(values.rccm ? { rccm: values.rccm } : {}),
  };
}
