import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  Save,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { z } from 'zod';
import {
  userSchema,
  type UserFormValues,
} from '../schemas/userSchema';
import { useSaveUser, useUsers } from '../hooks/useUsers';
import type { UserStatus } from '../../../constants/users';
import type { User } from '../../../types/user';
import { useAuth } from '../../../context/AuthContext';

interface UserFormProps {
  initialData?: User;
  isEdit?: boolean;
  onResetPasswordRequested?: () => void;
  onConflict?: (message: string) => void;
}

const ROLE_DESCRIPTIONS: Record<'ADMIN' | 'MEMBER', string> = {
  ADMIN: 'Full administration access across accounts, contacts, reference lookups, and user management.',
  MEMBER: 'Manage assigned accounts and contacts; can create new accounts and log follow-ups.',
};

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  isEdit = false,
  onResetPasswordRequested,
  onConflict,
}) => {
  const navigate = useNavigate();
  const saveMutation = useSaveUser();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const availableRoles: Array<'ADMIN' | 'MEMBER'> = isSuperAdmin ? ['ADMIN', 'MEMBER'] : ['MEMBER'];

  // Fetch admin list for Super Admin's manager assignment dropdown
  const { data: adminsResponse } = useUsers({ role: 'ADMIN', size: 100 });
  const adminOptions = React.useMemo(() => {
    return adminsResponse?.content || [];
  }, [adminsResponse]);

  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = React.useMemo(() => {
    return userSchema.superRefine((data, ctx) => {
      if (!isEdit) {
        if (!data.password || data.password.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must be at least 8 characters long',
            path: ['password'],
          });
        }
        if (data.password !== data.confirmPassword) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Passwords do not match',
            path: ['confirmPassword'],
          });
        }
      }
      if (isSuperAdmin && data.role === 'MEMBER' && !data.managerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please assign an Admin / Manager for this member',
          path: ['managerId'],
        });
      }
    });
  }, [isEdit, isSuperAdmin]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      username: initialData?.username || '',
      role: (initialData?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'),
      status: (initialData?.status as UserStatus) || 'ACTIVE',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      managerId: initialData?.managerId || '',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedRole = watch('role');

  // Prevent accidental loss of unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (values: UserFormValues) => {
    setServerErrors({});

    const assignedManagerId =
      values.role === 'ADMIN'
        ? null
        : isSuperAdmin
          ? (values.managerId || null)
          : (currentUser?.id || null);

    try {
      if (isEdit) {
        await saveMutation.mutateAsync({
          id: initialData?.id,
          data: {
            name: values.name.trim(),
            code: values.code ? values.code.trim().toUpperCase() : null,
            username: values.username.trim().toLowerCase(),
            role: values.role,
            status: values.status,
            email: values.email.trim().toLowerCase(),
            phone: values.phone && values.phone.trim() ? values.phone.trim() : null,
            managerId: assignedManagerId,
          },
        });
      } else {
        await saveMutation.mutateAsync({
          data: {
            name: values.name.trim(),
            code: values.code ? values.code.trim().toUpperCase() : null,
            username: values.username.trim().toLowerCase(),
            password: values.password || '',
            role: values.role,
            status: values.status,
            email: values.email.trim().toLowerCase(),
            phone: values.phone && values.phone.trim() ? values.phone.trim() : null,
            managerId: assignedManagerId,
            permissions: [],
          },
        });
      }

      // Navigate back to users list on success
      navigate('/users', { replace: true });
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          };
        };
        message?: string;
      };

      const status = errorObj.response?.status;
      const responseData = errorObj.response?.data;

      if (status === 409 && onConflict) {
        onConflict(responseData?.message || errorObj.message || 'Action conflict detected.');
        return;
      }

      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const map: Record<string, string> = {};
        responseData.errors.forEach((e) => {
          map[e.field] = e.message;
        });
        setServerErrors(map);
      } else {
        setServerErrors({
          form:
            responseData?.message ||
            errorObj.message ||
            'An unexpected error occurred while saving user.',
        });
      }
    } finally {
      if (!isEdit) {
        setValue('password', '');
        setValue('confirmPassword', '');
      }
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmLeave) {
        e.preventDefault();
      }
    }
  };

  if (initialData?.role === 'SUPER_ADMIN') {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-8 rounded-xl border shadow-xs text-center space-y-4"
      >
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text)]">Super Admin Account Protected</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          The Super Admin account cannot be deactivated or changed. To update your profile photo, name, or change password, please visit your Profile page.
        </p>
        <div className="pt-2">
          <Link
            to="/users"
            style={{
              backgroundColor: 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="px-5 py-2 rounded-lg text-sm font-semibold inline-block"
          >
            Back to Users Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top Banner Error if generic */}
      {serverErrors.form && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--status-overdue-bg)] p-4 text-xs text-[var(--status-overdue-text)] border border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{serverErrors.form}</span>
        </div>
      )}

      {/* Primary Card: User Identification */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-6 rounded-xl border shadow-xs space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[var(--link)]" />
            <h3 style={{ color: 'var(--text)' }} className="text-base font-bold">
              User Profile &amp; Credentials
            </h3>
          </div>
          {isEdit && onResetPasswordRequested && (
            <button
              type="button"
              onClick={onResetPasswordRequested}
              style={{
                backgroundColor: 'var(--btn-secondary-bg)',
                borderColor: 'var(--btn-secondary-border)',
                color: 'var(--text)',
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-[var(--link)]" />
              <span>Reset Password</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., Ploy Somboon"
              style={{
                borderColor:
                  errors.name || serverErrors.name ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
            />
            {errors.name && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.name.message}
              </p>
            )}
            {serverErrors.name && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.name}
              </p>
            )}
          </div>

          {/* Initials Code (Optional) */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Initials Code <span className="text-[var(--text-secondary)] font-normal">(Optional, max 20)</span>
            </label>
            <input
              type="text"
              {...register('code')}
              placeholder="e.g., PLY"
              maxLength={20}
              style={{
                borderColor:
                  errors.code || serverErrors.code ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none uppercase focus:border-[var(--btn-primary)]"
            />
            {errors.code && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.code.message}
              </p>
            )}
            {serverErrors.code && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.code}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="sm:col-span-2">
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('username')}
              placeholder="e.g., ploy.s"
              style={{
                borderColor:
                  errors.username || serverErrors.username
                    ? 'var(--status-overdue-text)'
                    : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none lowercase focus:border-[var(--btn-primary)]"
            />
            {errors.username && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.username.message}
              </p>
            )}
            {serverErrors.username && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              maxLength={254}
              {...register('email')}
              placeholder="e.g., ploy.s@saga-consulting.com"
              style={{
                borderColor:
                  errors.email || serverErrors.email
                    ? 'var(--status-overdue-text)'
                    : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
            />
            {(errors.email || serverErrors.email) && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.email?.message || serverErrors.email}
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase">
                Phone
              </label>
              <span style={{ color: 'var(--text-secondary)' }} className="text-[11px] font-normal">
                Optional
              </span>
            </div>
            <input
              type="tel"
              maxLength={20}
              {...register('phone')}
              placeholder="e.g., +66 81 234 5678"
              style={{
                borderColor:
                  errors.phone || serverErrors.phone
                    ? 'var(--status-overdue-text)'
                    : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
            />
            {(errors.phone || serverErrors.phone) && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.phone?.message || serverErrors.phone}
              </p>
            )}
          </div>

          {/* Password Fields (Create Mode Only) */}
          {!isEdit && (
            <>
              <div>
                <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password' as const)}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    style={{
                      borderColor:
                        'password' in errors && errors.password
                          ? 'var(--status-overdue-text)'
                          : 'var(--border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--text)',
                    }}
                    className="w-full px-3.5 py-2 pr-10 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {'password' in errors && errors.password && (
                  <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword' as const)}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    style={{
                      borderColor:
                        'confirmPassword' in errors && errors.confirmPassword
                          ? 'var(--status-overdue-text)'
                          : 'var(--border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--text)',
                    }}
                    className="w-full px-3.5 py-2 pr-10 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {'confirmPassword' in errors && errors.confirmPassword && (
                  <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Secondary Card: Role & Access Scope */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-6 rounded-xl border shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
          <ShieldCheck className="w-5 h-5 text-[var(--link)]" />
          <h3 style={{ color: 'var(--text)' }} className="text-base font-bold">
            Role Assignment &amp; System Privileges
          </h3>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Permissions are determined strictly by the assigned role according to the system RBAC policy.
        </p>

        {/* Role Selection with Plain Text One-Line Descriptions */}
        <div className="space-y-3 pt-1">
          {availableRoles.map((roleKey) => {
            const isChecked = selectedRole === roleKey;
            return (
              <label
                key={roleKey}
                style={{
                  borderColor: isChecked ? 'var(--btn-primary)' : 'var(--border)',
                  backgroundColor: isChecked ? 'var(--tag-bg)' : 'var(--background)',
                }}
                className="flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer hover:border-[var(--btn-primary)]"
              >
                <input
                  type="radio"
                  value={roleKey}
                  {...register('role')}
                  className="mt-0.5 text-[var(--btn-primary)] focus:ring-[var(--btn-primary)]"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text)]">{roleKey}</span>
                  </div>
                  {/* One-line plain text description under each role */}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {ROLE_DESCRIPTIONS[roleKey]}
                  </p>
                </div>
              </label>
            );
          })}
          {errors.role && (
            <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Admin / Manager Selection (When Super Admin assigns a Member) */}
        {isSuperAdmin && selectedRole === 'MEMBER' && (
          <div className="pt-3 border-t border-[var(--border)]">
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Assigned Admin / Manager <span className="text-red-500">*</span>
            </label>
            <select
              {...register('managerId')}
              style={{
                borderColor:
                  errors.managerId || serverErrors.managerId
                    ? 'var(--status-overdue-text)'
                    : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)] cursor-pointer"
            >
              <option value="">Select an Admin</option>
              {adminOptions.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} (@{admin.username})
                </option>
              ))}
            </select>
            {errors.managerId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.managerId.message}
              </p>
            )}
            {serverErrors.managerId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.managerId}
              </p>
            )}
          </div>
        )}

        {/* Account Status */}
        <div className="pt-4 border-t border-[var(--border)]">
          <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
            Account Status <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <label
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
              }}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50"
            >
              <input
                type="radio"
                value="ACTIVE"
                {...register('status')}
                className="mt-0.5 text-[var(--btn-primary)]"
              />
              <div>
                <span className="text-xs font-semibold text-[var(--status-success-text)]">ACTIVE</span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Account is active; user can sign in and perform role-permitted activities.
                </p>
              </div>
            </label>

            <label
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
              }}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50"
            >
              <input
                type="radio"
                value="INACTIVE"
                {...register('status')}
                className="mt-0.5 text-[var(--btn-primary)]"
              />
              <div>
                <span className="text-xs font-semibold text-[var(--status-overdue-text)]">INACTIVE</span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Account is suspended; login access is immediately revoked.
                </p>
              </div>
            </label>
          </div>
          {errors.status && (
            <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
              {errors.status.message}
            </p>
          )}
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          to="/users"
          onClick={handleCancel}
          style={{
            backgroundColor: 'var(--btn-secondary-bg)',
            borderColor: 'var(--btn-secondary-border)',
            color: 'var(--btn-secondary-text)',
          }}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || saveMutation.isPending}
          style={{
            backgroundColor: 'var(--btn-primary)',
            color: 'var(--btn-primary-text)',
          }}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Save Changes' : 'Create User'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
