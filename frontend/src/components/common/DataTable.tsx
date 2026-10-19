import React from 'react';
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, RotateCcw } from 'lucide-react';
import { Skeleton } from './Skeleton';
import type { PageMeta, SortState } from '../../types/common';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  // Field name sent to the API when this column is sorted.
  sortField?: string;
  align?: 'left' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyMessage: string;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  meta?: PageMeta;
  onPageChange?: (page: number) => void;
  caption?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  error,
  onRetry,
  emptyMessage,
  sort,
  onSortChange,
  meta,
  onPageChange,
  caption,
}: DataTableProps<T>) {
  const toggleSort = (field: string) => {
    if (!onSortChange) return;
    const direction = sort?.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction });
  };

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;
  const firstRow = meta && meta.total > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const lastRow = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-[var(--status-overdue-bg)] p-6 text-center">
        <AlertCircle className="h-8 w-8 text-[var(--status-overdue-text)]" />
        <p className="mt-2 text-sm font-medium text-[var(--status-overdue-text)]">This list didn't load</p>
        <p className="mt-1 text-xs text-[var(--status-overdue-text)] opacity-90">
          {error instanceof Error ? error.message : 'Something went wrong while loading the data.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--btn-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--btn-primary-text)] shadow-xs transition hover:bg-[var(--btn-primary-hover)] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--table-header-bg)] text-xs text-[var(--table-header-text)]">
              {columns.map((column) => {
                const sorted = column.sortField && sort?.field === column.sortField ? sort.direction : undefined;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`px-4 py-2.5 font-semibold whitespace-nowrap ${column.align === 'right' ? 'text-right' : ''}`}
                  >
                    {column.sortField && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.sortField!)}
                        className="inline-flex items-center gap-1 rounded hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] cursor-pointer"
                      >
                        {column.header}
                        {sorted === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading
              ? Array.from({ length: 5 }, (_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => (
                  <tr key={rowKey(row)} className="bg-[var(--surface)] transition-colors hover:bg-[var(--background)]">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 align-top text-[var(--text)] ${column.align === 'right' ? 'text-right' : ''} ${column.className ?? ''}`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && rows?.length === 0 && (
          <div className="flex flex-col items-center justify-center bg-[var(--surface)] py-12 text-center text-[var(--text-secondary)]">
            <Inbox className="h-10 w-10 stroke-1" />
            <p className="mt-2 text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>

      {meta && onPageChange && meta.total > 0 && (
        <div className="mt-3 flex flex-col gap-2 text-xs text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums">
            Showing {firstRow}–{lastRow} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-semibold text-[var(--text)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="tabular-nums">
              Page {meta.page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= totalPages || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-semibold text-[var(--text)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
