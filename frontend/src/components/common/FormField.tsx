import React, { useId } from 'react';

interface FieldShellProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  count?: { value: number; max: number };
  children: (ids: { inputId: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}

// Label, hint, character count and error message around any input.
export const FieldShell: React.FC<FieldShellProps> = ({ label, required, hint, error, count, children }) => {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="block text-sm font-semibold text-[var(--text)]">
          {label}
          {required && <span className="ml-0.5 text-[var(--status-overdue-text)]" aria-hidden="true">*</span>}
        </label>
        {count && (
          <span
            className={`text-[11px] tabular-nums ${
              count.value > count.max ? 'text-[var(--status-overdue-text)]' : 'text-[var(--text-secondary)]'
            }`}
          >
            {count.value}/{count.max}
          </span>
        )}
      </div>
      {children({ inputId, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--text-secondary)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-[var(--status-overdue-text)]">
          {error}
        </p>
      )}
    </div>
  );
};
