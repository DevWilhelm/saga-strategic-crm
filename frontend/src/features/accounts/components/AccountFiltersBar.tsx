import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { AccountFilters } from '../../../types/account';
import type { AccountLookups } from '../../../types/lookup';

interface AccountFiltersBarProps {
  filters: AccountFilters;
  lookups?: AccountLookups;
  onFilterChange: (newFilters: Partial<AccountFilters>) => void;
  onResetFilters: () => void;
}

export const AccountFiltersBar: React.FC<AccountFiltersBarProps> = ({
  filters,
  lookups,
  onFilterChange,
  onResetFilters,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.q || '');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.q || '') !== searchTerm) {
        onFilterChange({ q: searchTerm || undefined, page: 0 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.q, onFilterChange]);

  const [prevFilterQ, setPrevFilterQ] = useState(filters.q || '');
  if ((filters.q || '') !== prevFilterQ) {
    setPrevFilterQ(filters.q || '');
    setSearchTerm(filters.q || '');
  }

  // Dependent subcategories
  const availableSubCategories = lookups?.subCategories.filter((s) => {
    if (!filters.categoryId) return true;
    return s.categoryId === filters.categoryId;
  }) || [];

  // Active filter count (excluding page, size, sort, q)
  const activeFilterKeys = [
    'businessLine',
    'tier',
    'ownerId',
    'categoryId',
    'subCategoryId',
    'serviceId',
    'dealSide',
    'country',
    'status',
  ] as const;

  const hasActiveFilters = activeFilterKeys.some((k) => Boolean(filters[k])) || Boolean(filters.q);

  const getOwnerName = (id?: string) => lookups?.owners.find((o) => o.id === id)?.name || id;
  const getCategoryName = (id?: string) => lookups?.categories.find((c) => c.id === id)?.name || id;
  const getSubCategoryName = (id?: string) => lookups?.subCategories.find((s) => s.id === id)?.name || id;
  const getServiceName = (id?: string) => lookups?.services.find((s) => s.id === id)?.name || id;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className="p-4 rounded-xl border shadow-xs space-y-4"
    >
      {/* Top Row: Search + Quick Filters + More Filters Toggle */}
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
            placeholder="Search accounts by name, website, country..."
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
                onFilterChange({ q: undefined, page: 0 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Business Line */}
          <select
            value={filters.businessLine || ''}
            onChange={(e) => onFilterChange({ businessLine: e.target.value || undefined, page: 0 })}
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border cursor-pointer outline-none"
          >
            <option value="">All Lines</option>
            {lookups?.businessLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>

          {/* Tier */}
          <select
            value={filters.tier || ''}
            onChange={(e) => onFilterChange({ tier: e.target.value || undefined, page: 0 })}
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border cursor-pointer outline-none"
          >
            <option value="">All Tiers</option>
            {lookups?.tiers.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Owner */}
          <select
            value={filters.ownerId || ''}
            onChange={(e) => onFilterChange({ ownerId: e.target.value || undefined, page: 0 })}
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border cursor-pointer outline-none max-w-[150px] truncate"
          >
            <option value="">All Owners</option>
            {lookups?.owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
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
            More filters
            {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              style={{
                borderColor: 'var(--border)',
                color: 'var(--status-overdue-text)',
                backgroundColor: 'var(--surface)',
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium hover:bg-red-50 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filters Panel */}
      {showMoreFilters && (
        <div
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border)',
          }}
          className="p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3"
        >
          {/* Category */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => {
                const newCat = e.target.value || undefined;
                onFilterChange({ categoryId: newCat, subCategoryId: undefined, page: 0 });
              }}
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border outline-none"
            >
              <option value="">All Categories</option>
              {lookups?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Category (Dependent on Category) */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Sub-Category
            </label>
            <select
              value={filters.subCategoryId || ''}
              onChange={(e) => onFilterChange({ subCategoryId: e.target.value || undefined, page: 0 })}
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border outline-none"
            >
              <option value="">All Sub-Categories</option>
              {availableSubCategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Service
            </label>
            <select
              value={filters.serviceId || ''}
              onChange={(e) => onFilterChange({ serviceId: e.target.value || undefined, page: 0 })}
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border outline-none"
            >
              <option value="">All Services</option>
              {lookups?.services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deal Side */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Deal Side
            </label>
            <select
              value={filters.dealSide || ''}
              onChange={(e) => onFilterChange({ dealSide: e.target.value || undefined, page: 0 })}
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border outline-none"
            >
              <option value="">All Deal Sides</option>
              {lookups?.dealSides.map((ds) => (
                <option key={ds} value={ds}>
                  {ds === 'BUY_SIDE' ? 'Buy-Side' : 'Sell-Side'}
                </option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">
              Country
            </label>
            <select
              value={filters.country || ''}
              onChange={(e) => onFilterChange({ country: e.target.value || undefined, page: 0 })}
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border outline-none"
            >
              <option value="">All Countries</option>
              {lookups?.countries.map((c) => (
                <option key={c} value={c}>
                  {c}
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
              onChange={(e) => onFilterChange({ status: e.target.value || undefined, page: 0 })}
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border outline-none"
            >
              <option value="">All Statuses</option>
              {lookups?.statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
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
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Search: "{filters.q}"
              <button
                type="button"
                onClick={() => onFilterChange({ q: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.businessLine && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Line: {filters.businessLine}
              <button
                type="button"
                onClick={() => onFilterChange({ businessLine: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.tier && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Tier: {filters.tier.replace('_', ' ')}
              <button
                type="button"
                onClick={() => onFilterChange({ tier: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.ownerId && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Owner: {getOwnerName(filters.ownerId)}
              <button
                type="button"
                onClick={() => onFilterChange({ ownerId: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.categoryId && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Category: {getCategoryName(filters.categoryId)}
              <button
                type="button"
                onClick={() => onFilterChange({ categoryId: undefined, subCategoryId: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.subCategoryId && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Sub-Category: {getSubCategoryName(filters.subCategoryId)}
              <button
                type="button"
                onClick={() => onFilterChange({ subCategoryId: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.serviceId && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Service: {getServiceName(filters.serviceId)}
              <button
                type="button"
                onClick={() => onFilterChange({ serviceId: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.dealSide && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Side: {filters.dealSide === 'BUY_SIDE' ? 'Buy' : 'Sell'}
              <button
                type="button"
                onClick={() => onFilterChange({ dealSide: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.country && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Country: {filters.country}
              <button
                type="button"
                onClick={() => onFilterChange({ country: undefined, page: 0 })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status && (
            <span
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--text)' }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200"
            >
              Status: {filters.status}
              <button
                type="button"
                onClick={() => onFilterChange({ status: undefined, page: 0 })}
                className="hover:text-red-600"
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
