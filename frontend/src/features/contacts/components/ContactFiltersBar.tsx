import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type {
  ContactFilterParams,
  ContactTier,
  RelationshipStatus,
  ContactStatus,
  ClosedStateFilter,
  FollowUpScheduleFilter,
} from '../../../types/contact';
import { CONTACT_TIERS, RELATIONSHIP_STATUSES, CONTACT_STATUSES } from '../../../types/contact';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../../../api/accountsApi';
import { usersApi } from '../../../api/usersApi';

interface ContactFiltersBarProps {
  filters: ContactFilterParams;
  onChange: (filters: Partial<ContactFilterParams>) => void;
  onReset: () => void;
}

export const ContactFiltersBar: React.FC<ContactFiltersBarProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.q || '');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.q || '') !== searchTerm) {
        onChange({ q: searchTerm || undefined, page: 0 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.q, onChange]);

  // Sync external search filter changes to internal searchTerm
  const [prevFilterQ, setPrevFilterQ] = useState(filters.q || '');
  if ((filters.q || '') !== prevFilterQ) {
    setPrevFilterQ(filters.q || '');
    setSearchTerm(filters.q || '');
  }

  // Fetch accounts list for company filter dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts', 'lookup-options'],
    queryFn: () => accountsApi.getAccounts({ size: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active users for owner dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users', 'options'],
    queryFn: () => usersApi.getUserOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const accounts = accountsData?.content || [];
  const users = usersData || [];

  // Count active secondary filters for badge
  const activeSecondaryCount = [
    Boolean(filters.relationshipStatus),
    Boolean(filters.status),
    Boolean(filters.closed && filters.closed !== 'ALL'),
    Boolean(filters.followUp && filters.followUp !== 'ALL'),
  ].filter(Boolean).length;

  // Check if any filter is active (including primary and search)
  const hasActiveFilters = Boolean(
    searchTerm ||
    filters.q ||
    filters.companyId ||
    filters.tier ||
    filters.ownerId ||
    filters.relationshipStatus ||
    filters.status ||
    (filters.closed && filters.closed !== 'ALL') ||
    (filters.followUp && filters.followUp !== 'ALL')
  );

  const getCompanyName = (id?: string) => accounts.find((a) => a.id === id)?.name || id;
  const getOwnerName = (id?: string) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.name} (${user.code})` : id;
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className="p-4 rounded-xl border shadow-xs space-y-4"
    >
      {/* Primary Row: Search + Quick Selects (Company, Tier, Owner) + More Filters Toggle */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by name, email, role, or company..."
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--text)',
            }}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onChange({ q: undefined, page: 0 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Company */}
          <select
            value={filters.companyId || ''}
            onChange={(e) => onChange({ companyId: e.target.value || undefined, page: 0 })}
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border cursor-pointer outline-none max-w-[170px] truncate"
            aria-label="Filter by Company"
          >
            <option value="">All Companies</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Tier */}
          <select
            value={filters.tier || ''}
            onChange={(e) => onChange({ tier: (e.target.value as ContactTier) || undefined, page: 0 })}
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border cursor-pointer outline-none"
            aria-label="Filter by Tier"
          >
            <option value="">All Tiers</option>
            {CONTACT_TIERS.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Owner */}
          <select
            value={filters.ownerId || ''}
            onChange={(e) => onChange({ ownerId: e.target.value || undefined, page: 0 })}
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border cursor-pointer outline-none max-w-[150px] truncate"
            aria-label="Filter by Owner"
          >
            <option value="">All Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>

          {/* More Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            style={{
              backgroundColor: showMoreFilters ? 'var(--tag-bg)' : 'var(--btn-secondary-bg)',
              borderColor: 'var(--btn-secondary-border)',
              color: showMoreFilters ? 'var(--tag-text)' : 'var(--btn-secondary-text)',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>More filters</span>
            {activeSecondaryCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs font-semibold bg-teal-600 text-white">
                {activeSecondaryCount}
              </span>
            )}
            {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onReset();
              }}
              style={{
                borderColor: 'var(--border)',
                color: 'var(--status-overdue-text)',
                backgroundColor: 'var(--surface)',
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
              title="Clear all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Secondary Panel (Light gray container, rounded soft border, with labels above) */}
      {showMoreFilters && (
        <div
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border)',
          }}
          className="p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3"
        >
          {/* Relationship */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Relationship
            </label>
            <select
              value={filters.relationshipStatus || ''}
              onChange={(e) =>
                onChange({
                  relationshipStatus: (e.target.value as RelationshipStatus) || undefined,
                  page: 0,
                })
              }
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
              }}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded-md border outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              <option value="">All Relationships</option>
              {RELATIONSHIP_STATUSES.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                onChange({
                  status: (e.target.value as ContactStatus) || undefined,
                  page: 0,
                })
              }
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
              }}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded-md border outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {CONTACT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Closed */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Closed
            </label>
            <select
              value={filters.closed || 'ALL'}
              onChange={(e) =>
                onChange({
                  closed: (e.target.value as ClosedStateFilter) || undefined,
                  page: 0,
                })
              }
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
              }}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded-md border outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              <option value="ALL">Closed: All</option>
              <option value="OPEN">Open Only</option>
              <option value="CLOSED">Closed Only</option>
            </select>
          </div>

          {/* Follow-up */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Follow-up
            </label>
            <select
              value={filters.followUp || 'ALL'}
              onChange={(e) =>
                onChange({
                  followUp: (e.target.value as FollowUpScheduleFilter) || undefined,
                  page: 0,
                })
              }
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
              }}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded-md border outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              <option value="ALL">Follow-up: All</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DUE_THIS_WEEK">Due this week</option>
              <option value="NONE_SCHEDULED">None scheduled</option>
            </select>
          </div>

          {/* Sort by */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Sort by
            </label>
            <select
              value={filters.sort || 'updatedDate,desc'}
              onChange={(e) => onChange({ sort: e.target.value, page: 0 })}
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
              }}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 rounded-md border outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
            >
              <option value="updatedDate,desc">Updated (Newest first)</option>
              <option value="updatedDate,asc">Updated (Oldest first)</option>
              <option value="name,asc">Name (A – Z)</option>
              <option value="name,desc">Name (Z – A)</option>
              <option value="tier,asc">Tier (Tier 1 first)</option>
              <option value="tier,desc">Tier (Tier 3 first)</option>
              <option value="nextFollowUpDate,asc">Next Follow-Up (Soonest)</option>
              <option value="nextFollowUpDate,desc">Next Follow-Up (Latest)</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium mr-1">
            Active filters:
          </span>

          {filters.q && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Search: "{filters.q}"
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onChange({ q: undefined, page: 0 });
                }}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.companyId && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Company: {getCompanyName(filters.companyId)}
              <button
                type="button"
                onClick={() => onChange({ companyId: undefined, page: 0 })}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.tier && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Tier: {filters.tier.replace('_', ' ')}
              <button
                type="button"
                onClick={() => onChange({ tier: undefined, page: 0 })}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.ownerId && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Owner: {getOwnerName(filters.ownerId)}
              <button
                type="button"
                onClick={() => onChange({ ownerId: undefined, page: 0 })}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.relationshipStatus && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Relationship: {filters.relationshipStatus}
              <button
                type="button"
                onClick={() => onChange({ relationshipStatus: undefined, page: 0 })}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Status: {filters.status}
              <button
                type="button"
                onClick={() => onChange({ status: undefined, page: 0 })}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.closed && filters.closed !== 'ALL' && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Closed: {filters.closed}
              <button
                type="button"
                onClick={() => onChange({ closed: undefined, page: 0 })}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.followUp && filters.followUp !== 'ALL' && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
            >
              Follow-up: {filters.followUp.replace(/_/g, ' ')}
              <button
                type="button"
                onClick={() => onChange({ followUp: undefined, page: 0 })}
                className="hover:text-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
