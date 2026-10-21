import { z } from 'zod';
import { CONTACT_TIERS, RELATIONSHIP_STATUSES, CONTACT_STATUSES } from '../../../types/contact';

const httpsUrlRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/i;

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Contact name is required')
    .max(100, 'Contact name cannot exceed 100 characters'),
  companyId: z
    .string()
    .min(1, 'Please select a company'),
  targetRole: z
    .string()
    .max(100, 'Target role cannot exceed 100 characters')
    .nullable()
    .optional(),
  personaCategory: z
    .string()
    .max(100, 'Persona category cannot exceed 100 characters')
    .nullable()
    .optional(),
  roleKeyword: z
    .string()
    .max(100, 'Role keyword cannot exceed 100 characters')
    .nullable()
    .optional(),
  tier: z.enum(CONTACT_TIERS, {
    message: 'Please select a valid tier',
  }),
  linkedinSearchName: z
    .string()
    .max(100, 'LinkedIn search name cannot exceed 100 characters')
    .nullable()
    .optional(),
  linkedinProfileUrl: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || httpsUrlRegex.test(val.trim()),
      'LinkedIn profile URL must be a valid secure URL starting with https://'
    ),
  email: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
      'Please enter a valid email address'
    ),
  phoneNo: z
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .nullable()
    .optional(),
  targetAngle: z
    .string()
    .max(1000, 'Target angle cannot exceed 1000 characters')
    .nullable()
    .optional(),
  status: z.enum(CONTACT_STATUSES, {
    message: 'Please select a valid status',
  }),
  nextStep: z
    .string()
    .max(1000, 'Next step cannot exceed 1000 characters')
    .nullable()
    .optional(),
  ownerId: z
    .string()
    .min(1, 'Please assign an owner'),
  note: z
    .string()
    .max(1000, 'Note cannot exceed 1000 characters')
    .nullable()
    .optional(),
  relationshipStatus: z.enum(RELATIONSHIP_STATUSES, {
    message: 'Please select a relationship status',
  }),
  isClosed: z.boolean(),
  remark: z
    .string()
    .max(1000, 'Remark cannot exceed 1000 characters')
    .nullable()
    .optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
