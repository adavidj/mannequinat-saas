import { z } from 'zod';

const dateSchema = z.coerce.date();

const experienceFields = {
  title: z.string().trim().min(2).max(150),
  org: z.string().trim().min(2).max(150),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
};

const chronologicalExperienceSchema = z
  .object(experienceFields)
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: 'La date de fin doit être postérieure ou égale à la date de début.',
    path: ['endDate'],
  });

export const createExperienceSchema = chronologicalExperienceSchema;
export type CreateExperienceDto = z.infer<typeof createExperienceSchema>;

export const updateExperienceSchema = z
  .object(experienceFields)
  .partial()
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }
      return data.endDate >= data.startDate;
    },
    {
      message: 'La date de fin doit être postérieure ou égale à la date de début.',
      path: ['endDate'],
    },
  );
export type UpdateExperienceDto = z.infer<typeof updateExperienceSchema>;
