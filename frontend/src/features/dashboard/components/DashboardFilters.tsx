import React, { useMemo } from 'react';
import { Filter, RotateCcw, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { Skeleton } from '../../../components/common/Skeleton';

export const DashboardFilters: React.FC = () => {
  const { filters, setFilter, setBusinessLine, resetFilters } = useDashboardFilters();
  const { data, isLoading, isError, error, refetch } = useFilterOptions();

  const formatTierLabel = (tier: string): string => {
    if (tier === 'TIER_1') return 'Tier 1';
    if (tier === 'TIER_2') return 'Tier 2';
    if (tier === 'TIER_3') return 'Tier 3';
    return tier;
  };

  const formatDealSideLabel = (side: string): string => {
    if (side === 'BUY_SIDE') return 'Buy-Side';
    if (side === 'SELL_SIDE') return 'Sell-Side';
    return side;
  };

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.ownerId && filters.ownerId !== 'ALL') count++;
    if (filters.tier && filters.tier !== 'ALL') count++;
    if (filters.dealSide && filters.dealSide !== 'ALL') count++;
    if (filters.country && filters.country !== 'ALL') count++;
    if (filters.businessLine && filters.businessLine !== 'All lines' && filters.businessLine !== 'ALL') count++;
    return count;
  }, [filters]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[var(--status-overdue-text)]/30 bg-[var(--status-overdue-bg)] p-3.5 text-xs text-[var(--status-overdue-text)] shadow-xs">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Failed to load filter options ({error instanceof Error ? error.message : 'Network error'})
          </span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1 rounded-md bg-[var(--btn-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--btn-primary-text)] shadow-xs hover:bg-[var(--btn-primary-hover)] cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Filter Title & Active Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--tag-bg)] text-[var(--tag-text)]">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--text)]">
            Filters
          </span>
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--btn-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--btn-primary-text)]">
              <Check className="h-2.5 w-2.5" />
              {activeCount} active
            </span>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Business Line Filter (was in the old top bar) */}
          <div className="relative">
            <label htmlFor="filter-business-line" className="sr-only">
              Business line
            </label>
            <select
              id="filter-business-line"
              value={filters.businessLine || 'All lines'}
              onChange={(e) => setBusinessLine(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-xs font-medium text-[var(--text)] shadow-xs transition hover:border-[var(--btn-primary)] focus:border-[var(--btn-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--btn-primary)] cursor-pointer"
            >
              {(data?.businessLines?.length ? data.businessLines : ['All lines']).map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)] opacity-70" />
          </div>

          {/* Owner Filter */}
          <div className="relative">
            <label htmlFor="filter-owner" className="sr-only">
              Owner
            </label>
            <select
              id="filter-owner"
              value={filters.ownerId || 'ALL'}
              onChange={(e) => setFilter('ownerId', e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-xs font-medium text-[var(--text)] shadow-xs transition hover:border-[var(--btn-primary)] focus:border-[var(--btn-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--btn-primary)] cursor-pointer"
            >
              <option value="ALL">All Owners</option>
              {data?.owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)] opacity-70" />
          </div>

          {/* Tier Filter */}
          <div className="relative">
            <label htmlFor="filter-tier" className="sr-only">
              Tier
            </label>
            <select
              id="filter-tier"
              value={filters.tier || 'ALL'}
              onChange={(e) => setFilter('tier', e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-xs font-medium text-[var(--text)] shadow-xs transition hover:border-[var(--btn-primary)] focus:border-[var(--btn-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--btn-primary)] cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              {data?.tiers.map((tier) => (
                <option key={tier} value={tier}>
                  {formatTierLabel(tier)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)] opacity-70" />
          </div>

          {/* Deal Side Filter */}
          <div className="relative">
            <label htmlFor="filter-dealside" className="sr-only">
              Deal Side
            </label>
            <select
              id="filter-dealside"
              value={filters.dealSide || 'ALL'}
              onChange={(e) => setFilter('dealSide', e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-xs font-medium text-[var(--text)] shadow-xs transition hover:border-[var(--btn-primary)] focus:border-[var(--btn-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--btn-primary)] cursor-pointer"
            >
              <option value="ALL">All Deal Sides</option>
              {data?.dealSides.map((side) => (
                <option key={side} value={side}>
                  {formatDealSideLabel(side)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)] opacity-70" />
          </div>

          {/* Country Filter */}
          <div className="relative">
            <label htmlFor="filter-country" className="sr-only">
              Country
            </label>
            <select
              id="filter-country"
              value={filters.country || 'ALL'}
              onChange={(e) => setFilter('country', e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-xs font-medium text-[var(--text)] shadow-xs transition hover:border-[var(--btn-primary)] focus:border-[var(--btn-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--btn-primary)] cursor-pointer"
            >
              <option value="ALL">All Countries</option>
              {data?.countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)] opacity-70" />
          </div>
        </div>

        {/* Clear Filters Button (Secondary button: white, border #E2E8F0, ink text) */}
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] px-3 py-2 text-xs font-semibold text-[var(--btn-secondary-text)] shadow-xs transition hover:bg-[var(--background)] cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear filters ({activeCount})</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--btn-secondary-border)]/50 bg-[var(--btn-secondary-bg)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] opacity-40 cursor-not-allowed shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span>No active filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
