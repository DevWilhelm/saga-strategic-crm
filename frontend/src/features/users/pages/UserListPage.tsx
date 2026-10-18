import React, { useMemo, useCallback, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import type { UserFilters, UserListItem } from '../../../types/user';
import { UserFiltersBar } from '../components/UserFiltersBar';
import { UserTable } from '../components/UserTable';
import { LoadingSkeleton, EmptyState, ErrorState } from '../../../components/common/WidgetState';
import { ConflictModalDialog } from '../components/ConflictModalDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { Can } from '../../../auth/Can';

import { useAuth } from '../../../context/AuthContext';

export const UserListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();

  // Dialog states
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [resetTargetUser, setResetTargetUser] = useState<UserListItem | null>(null);

  // Parse filters from URL query string
  const filters: UserFilters = useMemo(() => {
    return {
      q: searchParams.get('q') || undefined,
      role: (searchParams.get('role') as UserFilters['role']) || undefined,
      status: (searchParams.get('status') as UserFilters['status']) || undefined,
      managerId: (isSuperAdmin ? searchParams.get('managerId') : undefined) || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 0,
      size: searchParams.get('size') ? parseInt(searchParams.get('size')!, 10) : 10,
      sort: searchParams.get('sort') || 'updatedDate,desc',
    };
  }, [searchParams, isSuperAdmin]);

  // Fetch admin list for Super Admin's manager filter
  const { data: adminsResponse } = useUsers({ role: 'ADMIN', size: 100 });
  const adminOptions = useMemo(() => {
    return adminsResponse?.content.map((u) => ({ id: u.id, name: u.name })) || [];
  }, [adminsResponse]);

  // Sync state back to URL query string
  const updateFilters = useCallback(
    (newParams: Partial<UserFilters>) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          Object.entries(newParams).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
              updated.delete(key);
            } else {
              updated.set(key, String(value));
            }
          });
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams();
        const currentSize = prev.get('size');
        const currentSort = prev.get('sort');
        if (currentSize) updated.set('size', currentSize);
        if (currentSort) updated.set('sort', currentSort);
        return updated;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // Query users directory with TanStack Query
  const { data: usersResponse, isLoading, isError, error, refetch } = useUsers(filters);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            User Directory &amp; RBAC
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            Administer system personnel, assign advisory roles, and customize granular privilege permissions.
          </p>
        </div>

        {/* "+ New User" Button */}
        <Can action="user.manage">
          <div>
            <Link
              to="/users/new"
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ New User</span>
            </Link>
          </div>
        </Can>
      </div>

      {/* Filter and Search Bar */}
      <UserFiltersBar
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
        isSuperAdmin={isSuperAdmin}
        adminOptions={adminOptions}
      />

      {/* Content Area */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-xs"
        >
          <LoadingSkeleton rows={6} />
        </div>
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Failed to retrieve users. Please verify network or MSW.'}
          onRetry={() => refetch()}
        />
      ) : !usersResponse || usersResponse.content.length === 0 ? (
        <EmptyState
          title="No users match your criteria"
          description="Try modifying search keywords or clearing active filters to see all team members."
          actionLabel="Clear Filters"
          onAction={resetFilters}
        />
      ) : (
        <UserTable
          users={usersResponse.content}
          totalElements={usersResponse.totalElements}
          page={usersResponse.page}
          size={usersResponse.size}
          sort={filters.sort}
          onPageChange={(newPage) => updateFilters({ page: newPage })}
          onSizeChange={(newSize) => updateFilters({ size: newSize })}
          onSortChange={(newSort) => updateFilters({ sort: newSort, page: 0 })}
          onResetPassword={(targetUser) => setResetTargetUser(targetUser)}
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

      {/* Reset Password Modal Dialog */}
      <ResetPasswordDialog
        user={resetTargetUser}
        isOpen={Boolean(resetTargetUser)}
        onClose={() => setResetTargetUser(null)}
      />
    </div>
  );
};
