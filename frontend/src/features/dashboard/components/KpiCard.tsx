import React from 'react';
import { Skeleton } from '../../../components/common/Skeleton';

interface KpiCardProps {
  label: string;
  value?: number | string;
  icon: React.ComponentType<{ className?: string }>;
  isWarning?: boolean;
  isOverdue?: boolean;
  isLoading?: boolean;
  helperText?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon: Icon,
  isWarning = false,
  isOverdue = false,
  isLoading = false,
  helperText,
}) => {
  const isRed = isOverdue;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-between rounded-xl bg-[var(--surface)] p-5 shadow-xs border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl p-5 shadow-xs transition-all duration-150 ${
        isRed
          ? 'border border-[var(--status-overdue-text)]/30 bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)]'
          : isWarning
          ? 'border border-[var(--status-warning-text)]/30 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
          : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold tracking-wider uppercase ${
            isRed
              ? 'text-[var(--status-overdue-text)] opacity-90'
              : isWarning
              ? 'text-[var(--status-warning-text)] opacity-90'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          {label}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isRed
              ? 'bg-[var(--surface)] text-[var(--status-overdue-text)] shadow-xs'
              : isWarning
              ? 'bg-[var(--surface)] text-[var(--status-warning-text)] shadow-xs'
              : 'bg-[var(--tag-bg)] text-[var(--tag-text)]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4">
        <div
          className={`text-3xl font-extrabold tracking-tight ${
            isRed
              ? 'text-[var(--status-overdue-text)]'
              : isWarning
              ? 'text-[var(--status-warning-text)]'
              : 'text-[var(--text)]'
          }`}
        >
          {typeof value === 'number' ? value.toLocaleString() : value ?? '0'}
        </div>
        {helperText && (
          <p
            className={`mt-1 text-xs ${
              isRed
                ? 'text-[var(--status-overdue-text)] opacity-90'
                : isWarning
                ? 'text-[var(--status-warning-text)] opacity-90'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
};
