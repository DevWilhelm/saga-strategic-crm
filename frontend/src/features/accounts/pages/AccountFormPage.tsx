import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useAccountDetail } from '../hooks/useAccounts';
import { AccountForm } from '../components/AccountForm';
import { LoadingSkeleton, ErrorState } from '../components/WidgetState';

export const AccountFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: account, isLoading, isError, error, refetch } = useAccountDetail(id || '');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          to="/accounts"
          style={{ color: 'var(--link)' }}
          className="hover:underline font-medium"
        >
          Accounts
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        {isEdit && account ? (
          <>
            <Link
              to={`/accounts/${account.id}`}
              style={{ color: 'var(--link)' }}
              className="hover:underline truncate max-w-[200px]"
            >
              {account.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span style={{ color: 'var(--text-secondary)' }}>Edit</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>New Account</span>
        )}
      </nav>

      {/* Page Title & Back Link */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            {isEdit ? `Edit Account: ${account?.name || '...'}` : 'Create New Account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            {isEdit
              ? 'Update account profile, classification, strategic mandates, and ownership.'
              : 'Add a new target company profile, sponsor, or provider to the strategic CRM.'}
          </p>
        </div>

        <Link
          to={isEdit && account ? `/accounts/${account.id}` : '/accounts'}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel
        </Link>
      </div>

      {/* Main Content */}
      {isEdit && isLoading ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-xs"
        >
          <LoadingSkeleton rows={6} />
        </div>
      ) : isEdit && isError ? (
        <ErrorState
          message={error?.message || `Unable to load account with id '${id}' for editing.`}
          onRetry={() => refetch()}
        />
      ) : (
        <AccountForm initialData={account} isEdit={isEdit} />
      )}
    </div>
  );
};
