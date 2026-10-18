import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Camera,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { UserRoleBadge } from '../components/UserRoleBadge';
import { UserStatusBadge } from '../components/UserStatusBadge';
import {
  updateMyProfileSchema,
  type UpdateMyProfileFormValues,
} from '../schemas/userSchema';
import { useUpdateMyProfile, useDeletePhoto } from '../hooks/useUsers';
import { can } from '../../../auth/permissions';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { ChangePasswordDialog } from '../components/ChangePasswordDialog';
import { ProfilePhotoDialog } from '../components/ProfilePhotoDialog';
import { LoadingSkeleton, ErrorState } from '../../../components/common/WidgetState';

interface PermissionCapabilityItem {
  id: string;
  label: string;
  isAllowed: boolean;
}

export const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading, refetchUser } = useAuth();
  const updateProfileMutation = useUpdateMyProfile();
  const deletePhotoMutation = useDeletePhoto();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog & Toast states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  // Photo management state
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateMyProfileFormValues>({
    resolver: zodResolver(updateMyProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    values: user
      ? {
          name: user.name,
          email: user.email || '',
          phone: user.phone || '',
        }
      : undefined,
  });

  const watchedName = watch('name');

  // Derive initials live from the input name or current profile
  const displayName = watchedName?.trim() || user?.name || '';
  const initials = useMemo(() => {
    if (!displayName) return 'U';
    const parts = displayName.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [displayName]);

  // Window beforeunload guard for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
      }
    };
  }, [selectedImageSrc]);

  // Intercept navigation links across the page if there are unsaved changes
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      // Ignore if inside personal-info-form, dialog, or toast
      if (
        target.closest('#personal-info-form') ||
        target.closest('[role="dialog"]') ||
        target.closest('#profile-toast')
      ) {
        return;
      }

      const href = target.getAttribute('href');
      if (href && !href.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
        setPendingNavigation(() => () => navigate(href));
        setShowUnsavedModal(true);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [isDirty, navigate]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // File picker handler with strict validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so re-selecting same file fires onChange
    e.target.value = '';

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setPhotoValidationError('Choose a JPG, PNG or WebP image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoValidationError('Image must be 2 MB or smaller');
      return;
    }

    setPhotoValidationError(null);

    // Read image into DOM to check minimum dimensions
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        URL.revokeObjectURL(objectUrl);
        setPhotoValidationError('Image is too small (minimum 200x200 pixels)');
        return;
      }

      // Cleanup prior preview URL if any
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
      }

      setSelectedImageSrc(objectUrl);
      setIsCropModalOpen(true);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setPhotoValidationError('Failed to inspect image dimensions');
    };

    img.src = objectUrl;
  };

  const handleCloseCropModal = () => {
    setIsCropModalOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    }
  };

  const handleCropSuccess = async () => {
    handleCloseCropModal();
    await refetchUser();
    showToast('Profile photo updated');
  };

  const handleConfirmRemovePhoto = async () => {
    try {
      await deletePhotoMutation.mutateAsync();
      await refetchUser();
      setShowRemovePhotoModal(false);
      showToast('Profile photo removed');
    } catch {
      showToast('Failed to remove profile photo');
    }
  };

  const onSubmit = async (values: UpdateMyProfileFormValues) => {
    setServerErrors({});

    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email && values.email.trim() ? values.email.trim().toLowerCase() : null,
        phone: values.phone && values.phone.trim() ? values.phone.trim() : null,
      });

      // Reset form state with newly saved fields so isDirty becomes false
      reset({
        name: updatedUser.name,
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
      });
      // Refresh AuthContext to ensure Topbar and other global headers update immediately
      await refetchUser();
      showToast('Profile updated');
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

      const responseData = errorObj.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const fieldMap: Record<string, string> = {};
        responseData.errors.forEach((e) => {
          fieldMap[e.field] = e.message;
        });
        setServerErrors(fieldMap);
      } else {
        setServerErrors({
          form:
            responseData?.message ||
            errorObj.message ||
            'Unable to update profile. Please try again.',
        });
      }
    }
  };

  const handleConfirmDiscard = () => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      const nav = pendingNavigation;
      setPendingNavigation(null);
      nav();
    }
  };

  const handleCancelDiscard = () => {
    setPendingNavigation(null);
    setShowUnsavedModal(false);
  };

  // Plain-language capability list generated directly from the permission map
  const capabilities = useMemo<PermissionCapabilityItem[]>(() => {
    if (!user) return [];

    const canViewCore =
      can('dashboard.view', undefined, user) &&
      can('accounts.view', undefined, user) &&
      can('contacts.view', undefined, user);

    const canCreateAccounts = can('account.create', undefined, user);
    const canEditAccounts = can('account.edit', undefined, user);
    const editAccountLabel =
      user.role === 'MEMBER'
        ? 'Edit accounts (only accounts you own)'
        : 'Edit accounts';

    const canReassign = can('account.reassignOwner', undefined, user);
    const canManageLookups = can('lookup.manage', undefined, user);
    const canManageUsers = can('user.manage', undefined, user);

    return [
      {
        id: 'view-core',
        label: 'View dashboard, accounts and contacts',
        isAllowed: canViewCore,
      },
      {
        id: 'create-accounts',
        label: 'Create accounts',
        isAllowed: canCreateAccounts,
      },
      {
        id: 'edit-accounts',
        label: editAccountLabel,
        isAllowed: canEditAccounts,
      },
      {
        id: 'reassign-owners',
        label: 'Reassign owners',
        isAllowed: canReassign,
      },
      {
        id: 'manage-lookups',
        label: 'Manage categories, sub-categories and services',
        isAllowed: canManageLookups,
      },
      {
        id: 'manage-users',
        label: 'Manage users',
        isAllowed: canManageUsers,
      },
    ];
  }, [user]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            My profile
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            Manage your details and password.
          </p>
        </div>
        <LoadingSkeleton rows={4} className="border border-[var(--border)] rounded-xl bg-[var(--surface)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            My profile
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            Manage your details and password.
          </p>
        </div>
        <ErrorState message="Could not load your profile details." onRetry={() => refetchUser()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="profile-toast"
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success-text)',
            borderColor: 'var(--border)',
          }}
          className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-current opacity-70 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input for Profile Photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Page Header */}
      <div>
        <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
          My profile
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
          Manage your details and password.
        </p>
      </div>

      {/* Main Responsive Grid: Two columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Profile card, Personal info form, Account details */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Profile card with Profile Photo / Initials & Change/Remove Photo buttons */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="rounded-xl border p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Rounded Square Avatar */}
              <div
                style={{
                  backgroundColor: 'var(--sidebar)',
                  color: 'var(--sidebar-text)',
                  borderColor: 'var(--border)',
                }}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold shadow-xs select-none overflow-hidden border"
              >
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={`${user.name}'s profile photo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Identity & Actions */}
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <h2
                    style={{ color: 'var(--text)' }}
                    className="text-lg font-bold truncate leading-tight"
                  >
                    {displayName || user.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <UserRoleBadge role={user.role} />
                  </div>
                </div>

                {/* Photo Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoValidationError(null);
                      fileInputRef.current?.click();
                    }}
                    style={{
                      backgroundColor: 'var(--btn-secondary-bg)',
                      borderColor: 'var(--btn-secondary-border)',
                      color: 'var(--btn-secondary-text)',
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change photo</span>
                  </button>

                  {user.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowRemovePhotoModal(true)}
                      style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--status-overdue-text)',
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Validation Error Banner */}
            {photoValidationError && (
              <div
                style={{
                  backgroundColor: 'var(--status-overdue-bg)',
                  color: 'var(--status-overdue-text)',
                  borderColor: 'var(--border)',
                }}
                className="flex items-center gap-2 rounded-lg border p-3 text-xs font-semibold"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoValidationError}</span>
              </div>
            )}
          </div>

          {/* 2. Personal information card */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="rounded-xl border p-6 shadow-xs space-y-4"
          >
            <div>
              <h2 style={{ color: 'var(--text)' }} className="text-base font-bold">
                Personal information
              </h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
                Update your contact details and display name.
              </p>
            </div>

            {/* Generic form server error */}
            {serverErrors.form && (
              <div
                style={{
                  backgroundColor: 'var(--status-overdue-bg)',
                  color: 'var(--status-overdue-text)',
                  borderColor: 'var(--border)',
                }}
                className="flex items-start gap-2 rounded-lg border p-3 text-xs font-semibold"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverErrors.form}</span>
              </div>
            )}

            <form
              id="personal-info-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Name Field */}
              <div>
                <label
                  htmlFor="profileName"
                  style={{ color: 'var(--text)' }}
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="profileName"
                  type="text"
                  maxLength={100}
                  {...register('name')}
                  placeholder="Enter your name"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor:
                      errors.name || serverErrors.name
                        ? 'var(--status-overdue-text)'
                        : 'var(--border)',
                    color: 'var(--text)',
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)] transition-colors"
                />

                {(errors.name || serverErrors.name) && (
                  <p
                    style={{ color: 'var(--status-overdue-text)' }}
                    className="text-xs mt-1 font-medium"
                  >
                    {errors.name?.message || serverErrors.name}
                  </p>
                )}
              </div>

              {/* Email Field (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="profileEmail"
                    style={{ color: 'var(--text)' }}
                    className="block text-xs font-semibold uppercase tracking-wider"
                  >
                    Email
                  </label>
                  <span style={{ color: 'var(--text-secondary)' }} className="text-[11px] font-normal">
                    Optional
                  </span>
                </div>
                <input
                  id="profileEmail"
                  type="email"
                  maxLength={254}
                  {...register('email')}
                  placeholder="name@saga-consulting.com"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor:
                      errors.email || serverErrors.email
                        ? 'var(--status-overdue-text)'
                        : 'var(--border)',
                    color: 'var(--text)',
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)] transition-colors"
                />

                {(errors.email || serverErrors.email) && (
                  <p
                    style={{ color: 'var(--status-overdue-text)' }}
                    className="text-xs mt-1 font-medium"
                  >
                    {errors.email?.message || serverErrors.email}
                  </p>
                )}
              </div>

              {/* Phone Field (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="profilePhone"
                    style={{ color: 'var(--text)' }}
                    className="block text-xs font-semibold uppercase tracking-wider"
                  >
                    Phone
                  </label>
                  <span style={{ color: 'var(--text-secondary)' }} className="text-[11px] font-normal">
                    Optional
                  </span>
                </div>
                <input
                  id="profilePhone"
                  type="tel"
                  maxLength={20}
                  {...register('phone')}
                  placeholder="+66 81 234 5678"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor:
                      errors.phone || serverErrors.phone
                        ? 'var(--status-overdue-text)'
                        : 'var(--border)',
                    color: 'var(--text)',
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)] transition-colors"
                />

                {(errors.phone || serverErrors.phone) && (
                  <p
                    style={{ color: 'var(--status-overdue-text)' }}
                    className="text-xs mt-1 font-medium"
                  >
                    {errors.phone?.message || serverErrors.phone}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                {isDirty && (
                  <button
                    type="button"
                    onClick={() => setShowUnsavedModal(true)}
                    style={{
                      backgroundColor: 'var(--btn-secondary-bg)',
                      borderColor: 'var(--btn-secondary-border)',
                      color: 'var(--btn-secondary-text)',
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Discard changes
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!isDirty || isSubmitting || updateProfileMutation.isPending}
                  style={{
                    backgroundColor: 'var(--btn-primary)',
                    color: 'var(--btn-primary-text)',
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {(isSubmitting || updateProfileMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Account details read-only section */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="rounded-xl border p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
              <h2 style={{ color: 'var(--text)' }} className="text-base font-bold">
                Account details
              </h2>
              <div
                style={{ color: 'var(--text-secondary)' }}
                className="flex items-center gap-1.5 text-xs font-medium"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Managed by an administrator</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
              }}
              className="rounded-lg border p-4 space-y-3.5 text-xs"
            >
              {/* Username: plain without @ */}
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                  Username
                </span>
                <span style={{ color: 'var(--text)' }} className="font-mono font-semibold">
                  {user.username}
                </span>
              </div>

              {/* Code: renamed from Initials Code */}
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                  Code
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--tag-bg)',
                    color: 'var(--tag-text)',
                  }}
                  className="font-mono px-2 py-0.5 rounded font-bold"
                >
                  {user.code || '—'}
                </span>
              </div>

              {/* Role */}
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                  Role
                </span>
                <UserRoleBadge role={user.role} />
              </div>

              {/* Status */}
              <div className="flex justify-between items-center py-1">
                <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                  Status
                </span>
                <UserStatusBadge status={user.status || 'ACTIVE'} />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Security card & What you can do card */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 space-y-6">
          {/* 4. Security card */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="rounded-xl border p-6 shadow-xs space-y-4"
          >
            <div>
              <h2 style={{ color: 'var(--text)' }} className="text-base font-bold">
                Security
              </h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
                Manage your login access credentials.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
              }}
              className="flex items-center justify-between p-4 rounded-lg border gap-4"
            >
              <div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-semibold uppercase tracking-wider">
                  Password
                </p>
                <p style={{ color: 'var(--text)' }} className="font-mono text-sm tracking-widest mt-0.5 font-bold">
                  ********
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                style={{
                  backgroundColor: 'var(--btn-secondary-bg)',
                  borderColor: 'var(--btn-secondary-border)',
                  color: 'var(--btn-secondary-text)',
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
              >
                Change password
              </button>
            </div>
          </div>

          {/* 5. What you can do card */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="rounded-xl border p-6 shadow-xs space-y-4"
          >
            <div>
              <h2 style={{ color: 'var(--text)' }} className="text-base font-bold">
                What you can do
              </h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
                Features and actions permitted for your role.
              </p>
            </div>

            <div className="space-y-2.5">
              {capabilities.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: item.isAllowed
                      ? 'var(--surface)'
                      : 'var(--background)',
                    borderColor: 'var(--border)',
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border text-sm"
                >
                  <div
                    style={{
                      backgroundColor: item.isAllowed
                        ? 'var(--status-success-bg)'
                        : 'var(--background)',
                      color: item.isAllowed
                        ? 'var(--status-success-text)'
                        : 'var(--text-secondary)',
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  >
                    {item.isAllowed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <span
                    style={{
                      color: item.isAllowed
                        ? 'var(--text)'
                        : 'var(--text-secondary)',
                    }}
                    className="font-medium text-xs sm:text-sm leading-snug"
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => showToast('Password changed')}
      />

      {/* Profile Photo Crop Dialog */}
      <ProfilePhotoDialog
        isOpen={isCropModalOpen}
        imageSrc={selectedImageSrc}
        onClose={handleCloseCropModal}
        onSuccess={handleCropSuccess}
      />

      {/* Remove Photo Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemovePhotoModal}
        title="Remove profile photo?"
        message="Are you sure you want to remove your profile photo? Your avatar will revert to your initials."
        confirmLabel="Remove photo"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={deletePhotoMutation.isPending}
        onConfirm={handleConfirmRemovePhoto}
        onClose={() => setShowRemovePhotoModal(false)}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUnsavedModal}
        title="Discard unsaved changes?"
        message="You have unsaved changes to your personal information. Are you sure you want to discard them?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        isDestructive={true}
        onConfirm={handleConfirmDiscard}
        onClose={handleCancelDiscard}
      />
    </div>
  );
};
