import React, { useState } from 'react';
import { KeyRound, X, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useResetPassword } from '../hooks/useUsers';
import type { UserListItem } from '../../../types/user';

interface ResetPasswordDialogProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetMutation = useResetPassword();

  if (!isOpen || !user) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await resetMutation.mutateAsync({
        id: user.id,
        payload: { newPassword },
      });
      setSuccessMsg(`Password successfully reset for ${user.name}!`);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to reset password. Please try again.');
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-dialog-title"
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
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning-text)',
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs"
          >
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h3 id="reset-password-dialog-title" className="text-lg font-bold tracking-tight text-[var(--text)]">
              Reset Password
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Target user: <strong className="text-[var(--text)]">{user.name}</strong> (@{user.username})
            </p>
          </div>
        </div>

        {/* Success message banner */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--status-success-bg)] p-3 text-xs text-[var(--status-success-text)] font-semibold border border-green-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--status-overdue-bg)] p-3 text-xs text-[var(--status-overdue-text)] font-semibold border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--text)] mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 8 characters"
                required
                minLength={8}
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
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
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--text)] mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              style={{
                backgroundColor: 'var(--btn-secondary-bg)',
                borderColor: 'var(--btn-secondary-border)',
                color: 'var(--btn-secondary-text)',
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetMutation.isPending || Boolean(successMsg)}
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {resetMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Reset Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
