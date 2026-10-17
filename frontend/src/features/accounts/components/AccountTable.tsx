import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AccountListItem } from '../../../types/account';
import { TierBadge } from './TierBadge';
import { StatusBadge } from './StatusBadge';
import { BusinessLineDot } from './BusinessLineDot';
import { FollowUpDateBadge } from './FollowUpDateBadge';

interface AccountTableProps {
  accounts: AccountListItem[];
  totalElements: number;
  page: number;
  size: number;
  sort?: string;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
  onSortChange: (newSort: string) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  totalElements,
  page,
  size,
  sort = 'updatedDate,desc',
  onPageChange,
  onSizeChange,
  onSortChange,
}) => {
  const [currentField = 'updatedDate', currentDirection = 'desc'] = sort.split(',');

  const handleSort = (field: string) => {
    if (currentField === field) {
      const nextDir = currentDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(`${field},${nextDir}`);
    } else {
      // Default: soonest first (asc) for nextFollowUpDate, newest first (desc) for updatedDate, asc for name/tier
      const defaultDir = field === 'updatedDate' ? 'desc' : 'asc';
      onSortChange(`${field},${defaultDir}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(field);
    }
  };

  const renderSortIcon = (field: string) => {
    const isActive = currentField === field;
    if (isActive) {
      return currentDirection === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 ml-1 text-slate-700 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 ml-1 text-slate-700 shrink-0" aria-hidden="true" />
      );
    }
    // Faint arrow on hover only for inactive sortable headers
    return (
      <ArrowUpDown
        className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-40 transition-opacity text-slate-400 shrink-0"
        aria-hidden="true"
      />
    );
  };

  // Pagination calculation
  const totalPages = Math.ceil(totalElements / size);
  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className="rounded-xl border shadow-xs overflow-hidden flex flex-col"
    >
      {/* Horizontal Scrollable Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[850px]">
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--table-header-bg)',
                color: 'var(--table-header-text)',
                borderColor: 'var(--border)',
              }}
              className="border-b text-xs font-semibold uppercase tracking-wider select-none"
            >
              <th
                scope="col"
                aria-sort={currentField === 'name' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onClick={() => handleSort('name')}
                onKeyDown={(e) => handleKeyDown(e, 'name')}
                className="py-3 px-4 cursor-pointer group hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500/40"
              >
                <div className="flex items-center">
                  Account {renderSortIcon('name')}
                </div>
              </th>
              <th scope="col" className="py-3 px-4">Line</th>
              <th
                scope="col"
                aria-sort={currentField === 'tier' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onClick={() => handleSort('tier')}
                onKeyDown={(e) => handleKeyDown(e, 'tier')}
                className="py-3 px-3 cursor-pointer group hover:bg-slate-200/50 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500/40"
              >
                <div className="flex items-center justify-center">
                  Tier {renderSortIcon('tier')}
                </div>
              </th>
              <th scope="col" className="py-3 px-4">Owner</th>
              <th scope="col" className="py-3 px-4">Country</th>
              <th scope="col" className="py-3 px-3 text-center">Status</th>
              <th
                scope="col"
                aria-sort={currentField === 'nextFollowUpDate' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onClick={() => handleSort('nextFollowUpDate')}
                onKeyDown={(e) => handleKeyDown(e, 'nextFollowUpDate')}
                className="py-3 px-4 cursor-pointer group hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500/40"
              >
                <div className="flex items-center">
                  Next Follow-Up {renderSortIcon('nextFollowUpDate')}
                </div>
              </th>
              <th
                scope="col"
                aria-sort={currentField === 'updatedDate' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                onClick={() => handleSort('updatedDate')}
                onKeyDown={(e) => handleKeyDown(e, 'updatedDate')}
                className="py-3 px-4 cursor-pointer group hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500/40"
              >
                <div className="flex items-center">
                  Updated {renderSortIcon('updatedDate')}
                </div>
              </th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {accounts.map((acc) => (
              <tr
                key={acc.id}
                className="hover:bg-slate-50/75 transition-colors group"
                style={{ color: 'var(--text)' }}
              >
                {/* Account Name + Category */}
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <Link
                      to={`/accounts/${acc.id}`}
                      style={{ color: 'var(--link)' }}
                      className="font-semibold text-sm hover:underline flex items-center gap-1.5"
                    >
                      {acc.name}
                    </Link>
                    <span style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5 truncate max-w-[220px]">
                      {acc.categoryName} {acc.subCategoryName ? `/ ${acc.subCategoryName}` : ''}
                    </span>
                  </div>
                </td>

                {/* Line */}
                <td className="py-3 px-4">
                  <BusinessLineDot businessLine={acc.businessLine} />
                </td>

                {/* Tier */}
                <td className="py-3 px-3 text-center">
                  <TierBadge tier={acc.tier} />
                </td>

                {/* Owner */}
                <td className="py-3 px-4">
                  <span style={{ color: 'var(--text)' }} className="text-sm font-medium">
                    {acc.ownerName}
                  </span>
                </td>

                {/* Country */}
                <td className="py-3 px-4">
                  <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    {acc.country}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-3 text-center">
                  <StatusBadge status={acc.status} />
                </td>

                {/* Next */}
                <td className="py-3 px-4">
                  <FollowUpDateBadge dateStr={acc.nextFollowUpDate} />
                </td>

                {/* Updated */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                    {acc.updatedDate}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      to={`/accounts/${acc.id}`}
                      style={{
                        backgroundColor: 'var(--btn-secondary-bg)',
                        borderColor: 'var(--btn-secondary-border)',
                        color: 'var(--link)',
                      }}
                      className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/accounts/${acc.id}/edit`}
                      style={{
                        backgroundColor: 'var(--btn-secondary-bg)',
                        borderColor: 'var(--btn-secondary-border)',
                        color: 'var(--text-secondary)',
                      }}
                      className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          borderTopColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
        className="border-t px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm"
      >
        {/* Count string */}
        <div style={{ color: 'var(--text-secondary)' }}>
          Showing <span className="font-semibold text-slate-900">{startItem}-{endItem}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalElements}</span>
        </div>

        {/* Page Size & Navigation Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-secondary)' }}>Per page:</span>
            <select
              value={size}
              onChange={(e) => {
                onSizeChange(parseInt(e.target.value, 10));
                onPageChange(0);
              }}
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
              }}
              className="px-2 py-1 rounded border text-xs outline-none cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
              style={{
                borderColor: 'var(--btn-secondary-border)',
                color: page <= 0 ? 'var(--text-secondary)' : 'var(--btn-secondary-text)',
              }}
              className="p-1.5 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span style={{ color: 'var(--text-secondary)' }} className="px-2 font-medium">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              style={{
                borderColor: 'var(--btn-secondary-border)',
                color: page >= totalPages - 1 ? 'var(--text-secondary)' : 'var(--btn-secondary-text)',
              }}
              className="p-1.5 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
