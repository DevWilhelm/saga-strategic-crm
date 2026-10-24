import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface NoAccessPageProps {
  message?: string;
  requiredAction?: string;
}

export const NoAccessPage: React.FC<NoAccessPageProps> = ({
  message = "You do not have permission to access this page or perform this action.",
  requiredAction,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)] shadow-xs">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--text)]">
        Access Restricted
      </h1>

      <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
        {message}
      </p>

      {requiredAction && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[var(--background)] px-3 py-1.5 text-xs font-mono text-[var(--text-secondary)] border border-[var(--border)]">
          <span>Required privilege:</span>
          <span className="font-semibold text-[var(--link)]">{requiredAction}</span>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/accounts')}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--btn-primary)] px-4 py-2.5 text-sm font-medium text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Accounts</span>
        </button>
      </div>
    </div>
  );
};
