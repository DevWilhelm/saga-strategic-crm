import React, { useState } from 'react';
import { KeyRound, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useChangePassword } from '../hooks/useUsers';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const changePasswordMutation = useChangePassword();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientErrors({});
    setServerErrors({});

    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/[a-zA-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setClientErrors(newErrors);
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      // Clear fields ONLY after successful change
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setClientErrors({});
      setServerErrors({});
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      onClose();
      onSuccess();
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
            'Unable to change password. Please verify your current password.',
        });
      }
    }
  };

  const handleClose = () => {
    setClientErrors({});
    setServerErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const currentPasswordError = clientErrors.currentPassword || serverErrors.currentPassword;
  const newPasswordError = clientErrors.newPassword || serverErrors.newPassword;
  const confirmPasswordError = clientErrors.confirmPassword || serverErrors.confirmPassword;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        className="relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            style={{
              backgroundColor: 'var(--status-info-bg)',
              color: 'var(--status-info-text)',
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs"
          >
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h3 id="change-password-dialog-title" className="text-lg font-bold tracking-tight text-[var(--text)]">
              Change Password
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Update your account login password.
            </p>
          </div>
        </div>

        {/* Generic server error if not field specific */}
        {serverErrors.form && (
          <div
            style={{
              backgroundColor: 'var(--status-overdue-bg)',
              color: 'var(--status-overdue-text)',
              borderColor: 'var(--border)',
            }}
            className="rounded-lg border p-3 text-xs font-semibold"
            role="alert"
          >
            {serverErrors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Current Password Field */}
          <div>
            <label
              htmlFor="dialogCurrentPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--text)] mb-1"
            >
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="dialogCurrentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (clientErrors.currentPassword || serverErrors.currentPassword) {
                    setClientErrors((prev) => ({ ...prev, currentPassword: '' }));
                    setServerErrors((prev) => ({ ...prev, currentPassword: '' }));
                  }
                }}
                placeholder="Enter your current password"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: currentPasswordError ? 'var(--status-overdue-text)' : 'var(--border)',
                  color: 'var(--text)',
                }}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {currentPasswordError && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {currentPasswordError}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div>
            <label
              htmlFor="dialogNewPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--text)] mb-1"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="dialogNewPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (clientErrors.newPassword || serverErrors.newPassword) {
                    setClientErrors((prev) => ({ ...prev, newPassword: '' }));
                    setServerErrors((prev) => ({ ...prev, newPassword: '' }));
                  }
                }}
                placeholder="Minimum 8 characters"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: newPasswordError ? 'var(--status-overdue-text)' : 'var(--border)',
                  color: 'var(--text)',
                }}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              At least 8 characters, one letter and one number
            </p>
            {newPasswordError && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {newPasswordError}
              </p>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label
              htmlFor="dialogConfirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--text)] mb-1"
            >
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="dialogConfirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (clientErrors.confirmPassword || serverErrors.confirmPassword) {
                    setClientErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    setServerErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="Re-enter your new password"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: confirmPasswordError ? 'var(--status-overdue-text)' : 'var(--border)',
                  color: 'var(--text)',
                }}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={handleClose}
              disabled={changePasswordMutation.isPending}
              style={{
                backgroundColor: 'var(--btn-secondary-bg)',
                borderColor: 'var(--btn-secondary-border)',
                color: 'var(--btn-secondary-text)',
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Change password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
