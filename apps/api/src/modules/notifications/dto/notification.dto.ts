import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(50).default(20),
  skip: z.coerce.number().int().min(0).default(0),
  unreadOnly: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type NotificationListQueryDto = z.infer<typeof notificationListQuerySchema>;
