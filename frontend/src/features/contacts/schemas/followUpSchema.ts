import { z } from 'zod';

export const followUpFormSchema = z.object({
  action: z
    .string()
    .trim()
    .min(1, 'Action description is required')
    .max(200, 'Action cannot exceed 200 characters'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  period: z
    .number()
    .int('Period must be an integer number of days')
    .min(1, 'Period must be at least 1 day')
    .nullable()
    .optional(),
  lastContactedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  descriptionRemark: z
    .string()
    .max(1000, 'Description / remark cannot exceed 1000 characters')
    .nullable()
    .optional(),
  ownerId: z
    .string()
    .min(1, 'Please select an owner'),
});

export type FollowUpFormData = z.infer<typeof followUpFormSchema>;

export const markFollowUpDoneSchema = z.object({
  resultNote: z
    .string()
    .trim()
    .min(1, 'Please enter an outcome / result note')
    .max(1000, 'Result note cannot exceed 1000 characters'),
  scheduleNext: z.boolean(),
  nextDueDate: z
    .string()
    .optional(),
  nextAction: z
    .string()
    .max(200)
    .optional(),
  nextPeriod: z
    .number()
    .optional(),
  nextDescription: z
    .string()
    .max(1000)
    .optional(),
});

export type MarkFollowUpDoneFormData = z.infer<typeof markFollowUpDoneSchema>;
