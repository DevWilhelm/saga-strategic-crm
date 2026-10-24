import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useUserDetail } from '../hooks/useUsers';
import { UserForm } from '../components/UserForm';
import { LoadingSkeleton, ErrorState } from '../../../components/common/WidgetState';
import { ConflictModalDialog } from '../components/ConflictModalDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';

export const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const { data: user, isLoading, isError, error, refetch } = useUserDetail(id || '');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          to="/dashboard"
          style={{ color: 'var(--link)' }}
          className="hover:underline font-medium"
        >
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link
          to="/users"
          style={{ color: 'var(--link)' }}
          className="hover:underline font-medium"
        >
          Users
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        {isEdit && user ? (
          <>
            <span style={{ color: 'var(--text)' }} className="truncate max-w-[200px] font-semibold">
              {user.name}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span style={{ color: 'var(--text-secondary)' }}>Edit</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>New User</span>
        )}
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            {isEdit ? `Edit User: ${user?.name || '...'}` : 'Create New User'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            {isEdit
              ? 'Update account profile, change system advisory role, and manage account status.'
              : 'Provision a new team member with specific role privileges and initial credentials.'}
          </p>
        </div>

        <Link
          to="/users"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--btn-secondary-text)',
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </Link>
      </div>

      {/* Form Content / Loading / Error */}
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
          message={error?.message || `User with id '${id}' could not be retrieved.`}
          onRetry={() => refetch()}
        />
      ) : (
        <UserForm
          initialData={user}
          isEdit={isEdit}
          onResetPasswordRequested={() => setResetDialogOpen(true)}
          onConflict={(msg) => setConflictMessage(msg)}
        />
      )}

      {/* Inline 409 Conflict Modal Dialog */}
      <ConflictModalDialog
        isOpen={Boolean(conflictMessage)}
        title="Security Rule Blocked Action"
        message={conflictMessage || ''}
        onClose={() => setConflictMessage(null)}
      />

      {/* Reset Password Dialog */}
      {isEdit && user && (
        <ResetPasswordDialog
          user={user}
          isOpen={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
        />
      )}
    </div>
  );
};
