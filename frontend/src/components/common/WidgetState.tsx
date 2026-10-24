import React from 'react';
import { AlertCircle, RefreshCw, FolderSearch } from 'lucide-react';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load content.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      className={`flex flex-col items-center justify-center p-8 rounded-xl border text-center ${className}`}
    >
      <div
        style={{
          backgroundColor: 'var(--status-overdue-bg)',
          color: 'var(--status-overdue-text)',
        }}
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
      >
        <AlertCircle className="w-6 h-6" />
      </div>
      <p style={{ color: 'var(--text)' }} className="text-base font-semibold mb-1">
        Unable to Load Content
      </p>
      <p style={{ color: 'var(--text-secondary)' }} className="text-sm max-w-md mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            backgroundColor: 'var(--btn-primary)',
            color: 'var(--btn-primary-text)',
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-opacity hover:opacity-90 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
};

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Try adjusting your search criteria or clearing filters.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className={`flex flex-col items-center justify-center p-12 rounded-xl border text-center ${className}`}
    >
      <div
        style={{
          backgroundColor: 'var(--tag-bg)',
          color: 'var(--tag-text)',
        }}
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
      >
        <FolderSearch className="w-6 h-6" />
      </div>
      <p style={{ color: 'var(--text)' }} className="text-base font-semibold mb-1">
        {title}
      </p>
      <p style={{ color: 'var(--text-secondary)' }} className="text-sm max-w-sm mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            backgroundColor: 'var(--btn-secondary-bg)',
            borderColor: 'var(--btn-secondary-border)',
            color: 'var(--btn-secondary-text)',
          }}
          className="px-4 py-2 rounded-md font-medium text-sm border hover:bg-slate-50 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => {
  return (
    <div className={`space-y-3 p-4 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          style={{ backgroundColor: 'var(--table-header-bg)' }}
          className="h-10 rounded-md w-full"
        />
      ))}
    </div>
  );
};
