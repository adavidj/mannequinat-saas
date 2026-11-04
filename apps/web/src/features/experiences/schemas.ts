import { z } from 'zod';

import type { OwnedExperience } from '@/shared/types/api';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ.');

export const experienceFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'L’intitulé doit contenir au moins 2 caractères.')
      .max(150, '150 caractères maximum.'),
    org: z
      .string()
      .trim()
      .min(2, 'Le nom de l’organisation doit contenir au moins 2 caractères.')
      .max(150, '150 caractères maximum.'),
    startDate: dateOnly,
    endDate: z.union([z.literal(''), dateOnly]),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: 'La date de fin doit être postérieure ou égale à la date de début.',
    path: ['endDate'],
  });

export type ExperienceFormValues = z.infer<typeof experienceFormSchema>;

export const EMPTY_EXPERIENCE_FORM: ExperienceFormValues = {
  title: '',
  org: '',
  startDate: '',
  endDate: '',
};

export function experienceToFormValues(experience: OwnedExperience): ExperienceFormValues {
  return {
    title: experience.title,
    org: experience.org,
    startDate: experience.startDate.slice(0, 10),
    endDate: experience.endDate ? experience.endDate.slice(0, 10) : '',
  };
}

export function experienceToPayload(values: ExperienceFormValues): Record<string, unknown> {
  return {
    title: values.title.trim(),
    org: values.org.trim(),
    startDate: values.startDate,
    endDate: values.endDate === '' ? null : values.endDate,
  };
}
