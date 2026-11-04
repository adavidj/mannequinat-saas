import { z } from 'zod';

const organizationFields = {
  type: z.enum(['AGENCY', 'RECRUITER', 'TRAINING_ORGANIZATION']),
  name: z.string().trim().min(2).max(150),
  ifu: z.string().trim().min(3).max(100).optional(),
  rccm: z.string().trim().min(3).max(100).optional(),
};

export const createOrganizationSchema = z
  .object(organizationFields)
  .refine((data) => Boolean(data.ifu || data.rccm), {
    message: 'Un numéro IFU ou RCCM est obligatoire pour la vérification.',
    path: ['ifu'],
  });
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export const reviewOrganizationSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
});
export type ReviewOrganizationDto = z.infer<typeof reviewOrganizationSchema>;
