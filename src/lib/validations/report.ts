import { z } from 'zod';

export const reportSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  hours: z.coerce.number().min(0).max(24).optional(),
  tags: z.array(z.string()).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;
