import { z } from 'zod';

const measurementSchema = z.coerce.number().int().positive().max(300);
const visibilitySchema = z.enum(['PRIVATE', 'VERIFIED_AGENCIES', 'PUBLIC']);

const profileFields = {
  displayName: z.string().trim().min(2).max(100),
  birthDate: z.iso.date(),
  city: z.string().trim().min(2).max(100),
  heightCm: measurementSchema.optional(),
  chestCm: measurementSchema.optional(),
  waistCm: measurementSchema.optional(),
  hipsCm: measurementSchema.optional(),
  shoeSize: measurementSchema.optional(),
  visibility: visibilitySchema.optional(),
  bio: z.string().trim().max(2_000).optional(),
};

export const createProfileSchema = z.object(profileFields);
export type CreateProfileDto = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = z.object(profileFields).partial();
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
