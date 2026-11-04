import { z } from 'zod';

export const reportTargetTypes = [
  'USER',
  'PROFILE',
  'ORGANIZATION',
  'CONVERSATION',
  'MESSAGE',
  'PHOTO',
] as const;

export const createReportSchema = z.object({
  targetType: z.enum(reportTargetTypes),
  targetId: z.string().cuid(),
  reason: z.string().trim().min(10).max(2_000),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;

export const reportQueueQuerySchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  targetType: z.enum(reportTargetTypes).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export type ReportQueueQueryDto = z.infer<typeof reportQueueQuerySchema>;

export const updateReportSchema = z.object({
  status: z.enum(['IN_REVIEW', 'RESOLVED', 'DISMISSED']),
});

export type UpdateReportDto = z.infer<typeof updateReportSchema>;
