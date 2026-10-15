import React from 'react';
import { AlertCircle, RotateCcw, Inbox } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface WidgetContainerProps {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  error?: Error | unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
  loadingSkeleton?: React.ReactNode;
  children: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  subtitle,
  headerAction,
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyMessage = 'No records found for current criteria.',
  onRetry,
  className = '',
  loadingSkeleton,
  children,
}) => {
  const errorMessage =
    error instanceof Error ? error.message : 'An error occurred while loading data.';

  return (
    <section
      className={`flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-xs transition-all ${className}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--text)]">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* Content State Handling */}
      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          loadingSkeleton || (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-5/6" />
            </div>
          )
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--status-overdue-text)]/30 bg-[var(--status-overdue-bg)] p-6 text-center">
            <AlertCircle className="h-8 w-8 text-[var(--status-overdue-text)]" />
            <p className="mt-2 text-sm font-medium text-[var(--status-overdue-text)]">{title} failed to load</p>
            <p className="mt-1 text-xs text-[var(--status-overdue-text)] opacity-90">{errorMessage}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--btn-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--btn-primary-text)] shadow-xs transition hover:bg-[var(--btn-primary-hover)] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-[var(--text-secondary)]">
            <Inbox className="h-10 w-10 stroke-1" />
            <p className="mt-2 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};
