import { z } from 'zod';

export const createConversationSchema = z.object({
  profileId: z.string().cuid(),
  organizationId: z.string().cuid().optional(),
});
export type CreateConversationDto = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2_000),
});
export type SendMessageDto = z.infer<typeof sendMessageSchema>;

export const reportConversationSchema = z.object({
  reason: z.string().trim().min(10).max(2_000),
});
export type ReportConversationDto = z.infer<typeof reportConversationSchema>;
