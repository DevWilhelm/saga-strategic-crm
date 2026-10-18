import React, { useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAccounts, useAccountLookups } from '../hooks/useAccounts';
import type { AccountFilters } from '../../../types/account';
import { AccountFiltersBar } from '../components/AccountFiltersBar';
import { AccountTable } from '../components/AccountTable';
import { LoadingSkeleton, EmptyState, ErrorState } from '../../../components/common/WidgetState';
import { Can } from '../../../auth/Can';

export const AccountListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL query string
  const filters: AccountFilters = useMemo(() => {
    return {
      q: searchParams.get('q') || undefined,
      businessLine: searchParams.get('businessLine') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      subCategoryId: searchParams.get('subCategoryId') || undefined,
      serviceId: searchParams.get('serviceId') || undefined,
      tier: searchParams.get('tier') || undefined,
      dealSide: searchParams.get('dealSide') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      country: searchParams.get('country') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 0,
      size: searchParams.get('size') ? parseInt(searchParams.get('size')!, 10) : 10,
      sort: searchParams.get('sort') || 'updatedDate,desc',
    };
  }, [searchParams]);

  // Sync state back to URL query string
  const updateFilters = useCallback(
    (newParams: Partial<AccountFilters>) => {
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
        const currentSort = prev.get('sort');
        const currentSize = prev.get('size');
        if (currentSort) updated.set('sort', currentSort);
        if (currentSize) updated.set('size', currentSize);
        return updated;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // TanStack Query
  const { data: accountsResponse, isLoading, isError, error, refetch } = useAccounts(filters);
  const { data: lookups } = useAccountLookups();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            Accounts
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            Manage target corporate profiles, strategic accounts, and client relationships.
          </p>
        </div>

        {/* "+ New" Primary Button */}
        <Can action="account.create">
          <div>
            <Link
              to="/accounts/new"
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              + New
            </Link>
          </div>
        </Can>
      </div>

      {/* Filter and Search Bar */}
      <AccountFiltersBar
        filters={filters}
        lookups={lookups}
        onFilterChange={updateFilters}
        onResetFilters={resetFilters}
      />

      {/* Main Table / State Section */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="rounded-xl border p-4 shadow-xs"
        >
          <LoadingSkeleton rows={7} />
        </div>
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Failed to retrieve accounts from server.'}
          onRetry={() => refetch()}
        />
      ) : accountsResponse && accountsResponse.content.length > 0 ? (
        <AccountTable
          accounts={accountsResponse.content}
          totalElements={accountsResponse.totalElements}
          page={accountsResponse.page}
          size={accountsResponse.size}
          sort={filters.sort}
          onPageChange={(newPage) => updateFilters({ page: newPage })}
          onSizeChange={(newSize) => updateFilters({ size: newSize, page: 0 })}
          onSortChange={(newSort) => updateFilters({ sort: newSort, page: 0 })}
        />
      ) : (
        <EmptyState
          title="No accounts match your criteria"
          description="Try broadening your search term or clearing active filters to view all 134 accounts."
          actionLabel="Clear All Filters"
          onAction={resetFilters}
        />
      )}
    </div>
  );
};
