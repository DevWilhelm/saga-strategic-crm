import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ListTree, Pencil, Plus, Power, Search, X } from 'lucide-react';
import { DataTable, type Column } from '../../../components/common/DataTable';
import { RecordStatusBadge } from '../../../components/common/RecordStatusBadge';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Button } from '../../../components/common/Button';
import { SubCategoryFormModal } from '../components/SubCategoryFormModal';
import { useSetSubCategoryStatus, useSubCategories } from '../hooks/useSubCategories';
import { useCategoryOptions } from '../../categories/hooks/useCategories';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { getApiErrorInfo } from '../../../api/errors';
import { toPageMeta, type RecordStatus, type SortState } from '../../../types/common';
import type { SubCategoryRecord } from '../../../types/subCategory';

const PAGE_SIZE = 10;

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; subCategory: SubCategoryRecord };

const filterClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-sm text-[var(--text)] shadow-xs focus:border-[var(--btn-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--tag-bg)] cursor-pointer';

export const SubCategoryListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<RecordStatus | ''>('');
  const [sort, setSort] = useState<SortState>({ field: 'categoryName', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [statusTarget, setStatusTarget] = useState<SubCategoryRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading, isError, error, refetch, isFetching } = useSubCategories({
    q: debouncedSearch,
    categoryId: categoryId || undefined,
    status: status || undefined,
    page,
    size: PAGE_SIZE,
    sort,
  });
  const categoryOptions = useCategoryOptions();
  const setSubCategoryStatus = useSetSubCategoryStatus();
  const closeStatusDialog = useCallback(() => setStatusTarget(null), []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const confirmStatusChange = () => {
    if (!statusTarget) return;
    const nextStatus: RecordStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setPageError(null);
    setSubCategoryStatus.mutate(
      { id: statusTarget.id, status: nextStatus },
      {
        onSuccess: (saved) => {
          setNotice(`${saved.name} is now ${saved.status === 'ACTIVE' ? 'active' : 'inactive'}.`);
          setStatusTarget(null);
        },
        onError: (err) => {
          setPageError(getApiErrorInfo(err).message);
          setStatusTarget(null);
        },
      }
    );
  };

  const columns: Column<SubCategoryRecord>[] = [
    {
      key: 'name',
      header: 'Name',
      sortField: 'name',
      render: (s) => <span className="font-semibold text-[var(--text)]">{s.name}</span>,
    },
    {
      key: 'category',
      header: 'Parent category',
      sortField: 'categoryName',
      render: (s) => (
        <span className="inline-flex items-center rounded-md bg-[var(--tag-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--tag-text)] whitespace-nowrap">
          {s.categoryName}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-sm',
      render: (s) =>
        s.description ? (
          <span className="text-[var(--text-secondary)]">{s.description}</span>
        ) : (
          <span className="text-[var(--text-secondary)] opacity-60">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortField: 'status',
      render: (s) => <RecordStatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setForm({ mode: 'edit', subCategory: s })}
            aria-label={`Edit ${s.name}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--link)] transition hover:bg-[var(--table-header-bg)] cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setStatusTarget(s)}
            aria-label={`${s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${s.name}`}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition cursor-pointer ${
              s.status === 'ACTIVE'
                ? 'text-[var(--status-overdue-text)] hover:bg-[var(--status-overdue-bg)]'
                : 'text-[var(--status-success-text)] hover:bg-[var(--status-success-bg)]'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  const deactivating = statusTarget?.status === 'ACTIVE';
  const filtered = !!(debouncedSearch || categoryId || status);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
            <ListTree className="h-5 w-5 text-[var(--btn-primary)]" />
            Sub-categories
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
            The second level of account classification. Each sub-category belongs to one category.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setForm({ mode: 'create' })} className="self-start sm:self-auto">
          Add sub-category
        </Button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg bg-[var(--status-success-bg)] px-4 py-2.5 text-sm font-medium text-[var(--status-success-text)]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {pageError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-[var(--status-overdue-bg)] px-4 py-2.5 text-sm font-medium text-[var(--status-overdue-text)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{pageError}</span>
          <button type="button" onClick={() => setPageError(null)} aria-label="Dismiss" className="cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-sm">
            <label htmlFor="sub-category-search" className="sr-only">
              Search sub-categories
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              id="sub-category-search"
              type="search"
              value={search}
              onChange={(e) => {
                // A new search or filter always starts from the first page.
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-3 pl-9 text-sm text-[var(--text)] shadow-xs placeholder:text-[var(--text-secondary)] placeholder:opacity-70 focus:border-[var(--btn-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--tag-bg)]"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label htmlFor="sub-category-parent-filter" className="sr-only">
                Filter by parent category
              </label>
              <select
                id="sub-category-parent-filter"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(0);
                }}
                className={`${filterClass} sm:w-60`}
              >
                <option value="">All categories</option>
                {categoryOptions.data?.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sub-category-status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="sub-category-status-filter"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as RecordStatus | '');
                  setPage(0);
                }}
                className={`${filterClass} sm:w-44`}
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          {isFetching && !isLoading && (
            <span className="text-xs text-[var(--text-secondary)]" aria-live="polite">
              Updating…
            </span>
          )}
        </div>

        <DataTable
          caption="Sub-categories"
          columns={columns}
          rows={data?.content}
          rowKey={(s) => s.id}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyMessage={
            filtered
              ? 'No sub-categories match these filters. Try another name, category or status.'
              : 'No sub-categories yet. Add one under an existing category.'
          }
          sort={sort}
          onSortChange={setSort}
          meta={data ? toPageMeta(data) : undefined}
          onPageChange={(displayPage) => setPage(displayPage - 1)}
        />
      </section>

      {form.mode !== 'closed' && (
        <SubCategoryFormModal
          key={form.mode === 'edit' ? form.subCategory.id : 'new'}
          subCategory={form.mode === 'edit' ? form.subCategory : null}
          defaultCategoryId={categoryId || undefined}
          onClose={() => setForm({ mode: 'closed' })}
          onSaved={(saved, mode) => {
            setForm({ mode: 'closed' });
            setNotice(
              mode === 'created' ? `${saved.name} was added to ${saved.categoryName}.` : `${saved.name} was updated.`
            );
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!statusTarget}
        title={deactivating ? 'Deactivate sub-category?' : 'Activate sub-category?'}
        message={
          deactivating
            ? `${statusTarget?.name} will be marked inactive. Accounts that already use it keep it.`
            : `${statusTarget?.name} will be active again under ${statusTarget?.categoryName}.`
        }
        confirmLabel={deactivating ? 'Deactivate' : 'Activate'}
        isDestructive={deactivating}
        isLoading={setSubCategoryStatus.isPending}
        onConfirm={confirmStatusChange}
        onClose={closeStatusDialog}
      />
    </div>
  );
};
