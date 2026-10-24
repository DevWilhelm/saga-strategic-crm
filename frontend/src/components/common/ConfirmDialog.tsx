import React, { useEffect, useRef } from 'react';
import { AlertTriangle, UserCheck, X, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      {/* Modal Card */}
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
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            style={{
              backgroundColor: isDestructive
                ? 'var(--status-overdue-bg)'
                : 'var(--status-info-bg)',
              color: isDestructive
                ? 'var(--status-overdue-text)'
                : 'var(--status-info-text)',
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs"
          >
            {isDestructive ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <UserCheck className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 id="confirm-dialog-title" className="text-lg font-bold tracking-tight text-[var(--text)]">
              {title}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            style={{
              backgroundColor: 'var(--btn-secondary-bg)',
              borderColor: 'var(--btn-secondary-border)',
              color: 'var(--btn-secondary-text)',
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            style={{
              backgroundColor: isDestructive
                ? 'var(--status-overdue-text)'
                : 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
