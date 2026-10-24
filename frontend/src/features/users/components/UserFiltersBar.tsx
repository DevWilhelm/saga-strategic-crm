import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import type { UserFilters } from '../../../types/user';
import type { UserRole, UserStatus } from '../../../constants/users';

interface UserFiltersBarProps {
  filters: UserFilters;
  onFilterChange: (newFilters: Partial<UserFilters>) => void;
  onReset: () => void;
  isSuperAdmin?: boolean;
  adminOptions?: Array<{ id: string; name: string }>;
}

export const UserFiltersBar: React.FC<UserFiltersBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  isSuperAdmin = false,
  adminOptions = [],
}) => {
  const [searchInput, setSearchInput] = useState(filters.q || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.q || '')) {
        onFilterChange({ q: searchInput || undefined, page: 0 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.q, onFilterChange]);

  const [prevFilterQ, setPrevFilterQ] = useState(filters.q || '');
  if ((filters.q || '') !== prevFilterQ) {
    setPrevFilterQ(filters.q || '');
    setSearchInput(filters.q || '');
  }

  const hasActiveFilters = Boolean(
    filters.q || filters.role || filters.status || filters.managerId
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className="p-4 rounded-xl border shadow-xs space-y-3"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, username, or initials code..."
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border outline-none focus:border-[var(--btn-primary)]"
            aria-label="Search users"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onFilterChange({ q: undefined, page: 0 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-44">
          <select
            value={filters.role || ''}
            onChange={(e) =>
              onFilterChange({
                role: (e.target.value as UserRole) || undefined,
                page: 0,
              })
            }
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer focus:border-[var(--btn-primary)]"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
            <option value="ADMIN">ADMIN</option>
            <option value="MEMBER">MEMBER</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            value={filters.status || ''}
            onChange={(e) =>
              onFilterChange({
                status: (e.target.value as UserStatus) || undefined,
                page: 0,
              })
            }
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer focus:border-[var(--btn-primary)]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* Admin / Manager Filter (SUPER_ADMIN only) */}
        {isSuperAdmin && (
          <div className="w-full md:w-48">
            <select
              value={filters.managerId || ''}
              onChange={(e) =>
                onFilterChange({
                  managerId: e.target.value || undefined,
                  page: 0,
                })
              }
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer focus:border-[var(--btn-primary)]"
              aria-label="Filter by manager/admin"
            >
              <option value="">All Admins</option>
              {adminOptions.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            style={{
              backgroundColor: 'var(--btn-secondary-bg)',
              borderColor: 'var(--btn-secondary-border)',
              color: 'var(--btn-secondary-text)',
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
