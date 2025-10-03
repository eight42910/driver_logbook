import { z } from 'zod';

export const reportSchema = z.object({
  workDate: z.string().min(1, '日付は必須です'),
  clientId: z.string().min(1, 'クライアントは必須です'),
  memo: z.string().min(1, 'メモは必須です'),
  hours: z.coerce.number().min(0).max(24).optional(),
  tags: z.array(z.string()).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;
