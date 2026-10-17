import { z } from 'zod';

export const accountSchema = z.object({
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(200, 'Account name must not exceed 200 characters'),
  businessLine: z.enum(['Healthcare', 'Financial Advisory', 'Networking & Partnerships'], {
    message: 'Please select a valid business line',
  }),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().optional().nullable(),
  serviceId: z.string().min(1, 'Service is required'),
  tier: z.enum(['TIER_1', 'TIER_2', 'TIER_3'], {
    message: 'Please select a tier',
  }),
  ownerId: z.string().min(1, 'Account owner is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  dealSide: z.enum(['BUY_SIDE', 'SELL_SIDE']).optional().nullable(),
  country: z.string().optional().nullable(),
  websiteUrl: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid HTTP or HTTPS URL (e.g. https://example.com)' }
    ),
  sourceRef: z.string().optional().nullable(),
  note: z
    .string()
    .max(2000, 'Note must not exceed 2000 characters')
    .optional()
    .nullable(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
