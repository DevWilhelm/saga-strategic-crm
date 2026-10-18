import { z } from 'zod';
import { USER_ROLES, USER_STATUSES } from '../../../constants/users';

/**
 * SECURITY RULES:
 * 1. Password exists ONLY in CreateUserDTO and password reset/change DTOs.
 * 2. In edit mode, passwords are never handled by this form and are never stored or returned in User responses.
 * 3. Permissions are derived strictly from Role via the single role-based permission map in src/auth/permissions.ts.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_REGEX = /^[0-9+\-() ]+$/;

export const emailFieldSchema = z
  .string()
  .max(254, 'Email must not exceed 254 characters')
  .refine(
    (val) => !val || !val.trim() || EMAIL_REGEX.test(val.trim()),
    'Please enter a valid email address'
  )
  .optional()
  .nullable();

export const phoneFieldSchema = z
  .string()
  .max(20, 'Phone must not exceed 20 characters')
  .refine(
    (val) => {
      if (!val || !val.trim()) return true;
      const trimmed = val.trim();
      if (!PHONE_CHARS_REGEX.test(trimmed)) return false;
      const digits = trimmed.replace(/\D/g, '');
      return digits.length >= 7;
    },
    'Phone must contain at least 7 digits and only numbers, spaces, +, -, (, )'
  )
  .optional()
  .nullable();

export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters'),
  code: z
    .string()
    .max(20, 'Code must not exceed 20 characters')
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9._]+$/, 'Username may only contain alphanumeric characters, dots, and underscores'),
  role: z.enum(USER_ROLES, {
    message: 'Please select a valid user role',
  }),
  status: z.enum(USER_STATUSES, {
    message: 'Please select an account status',
  }),
  email: emailFieldSchema,
  phone: phoneFieldSchema,
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(/[a-zA-Z]/, 'New password must contain at least one letter')
      .regex(/[0-9]/, 'New password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const updateMyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  email: emailFieldSchema,
  phone: phoneFieldSchema,
});

export type UpdateMyProfileFormValues = z.infer<typeof updateMyProfileSchema>;
