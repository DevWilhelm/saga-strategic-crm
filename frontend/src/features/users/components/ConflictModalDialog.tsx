import React, { useEffect, useRef } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface ConflictModalDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const ConflictModalDialog: React.FC<ConflictModalDialogProps> = ({
  isOpen,
  title = 'Action Blocked',
  message,
  onClose,
}) => {
  const dismissBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      dismissBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

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
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            style={{
              backgroundColor: 'var(--status-overdue-bg)',
              color: 'var(--status-overdue-text)',
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs"
          >
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 id="conflict-dialog-title" className="text-lg font-bold tracking-tight text-[var(--text)]">
              {title}
            </h3>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
              HTTP 409 Conflict
            </span>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
          {message}
        </p>

        <div className="pt-2 flex justify-end">
          <button
            ref={dismissBtnRef}
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
