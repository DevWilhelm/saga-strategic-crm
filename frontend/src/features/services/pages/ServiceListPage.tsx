import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Handshake, Pencil, Plus, Power, Search, X } from 'lucide-react';
import { DataTable, type Column } from '../../../components/common/DataTable';
import { RecordStatusBadge } from '../../../components/common/RecordStatusBadge';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Button } from '../../../components/common/Button';
import { ServiceFormModal } from '../components/ServiceFormModal';
import { useServices, useSetServiceStatus } from '../hooks/useServices';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { getApiErrorInfo } from '../../../api/errors';
import { toPageMeta, type RecordStatus, type SortState } from '../../../types/common';
import type { ServiceRecord } from '../../../types/service';

const PAGE_SIZE = 10;

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; service: ServiceRecord };

export const ServiceListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RecordStatus | ''>('');
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [statusTarget, setStatusTarget] = useState<ServiceRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading, isError, error, refetch, isFetching } = useServices({
    q: debouncedSearch,
    status: status || undefined,
    page,
    size: PAGE_SIZE,
    sort,
  });
  const setServiceStatus = useSetServiceStatus();
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
    setServiceStatus.mutate(
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

  const columns: Column<ServiceRecord>[] = [
    {
      key: 'name',
      header: 'Name',
      sortField: 'name',
      render: (c) => <span className="font-semibold text-[var(--text)]">{c.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-md',
      render: (c) =>
        c.description ? (
          <span className="text-[var(--text-secondary)]">{c.description}</span>
        ) : (
          <span className="text-[var(--text-secondary)] opacity-60">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortField: 'status',
      render: (c) => <RecordStatusBadge status={c.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setForm({ mode: 'edit', service: c })}
            aria-label={`Edit ${c.name}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--link)] transition hover:bg-[var(--table-header-bg)] cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setStatusTarget(c)}
            aria-label={`${c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${c.name}`}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition cursor-pointer ${
              c.status === 'ACTIVE'
                ? 'text-[var(--status-overdue-text)] hover:bg-[var(--status-overdue-bg)]'
                : 'text-[var(--status-success-text)] hover:bg-[var(--status-success-bg)]'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  const deactivating = statusTarget?.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
            <Handshake className="h-5 w-5 text-[var(--btn-primary)]" />
            Services
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
            The advisory services an account can be linked to, such as M&amp;A Advisory or Commercial Due Diligence.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setForm({ mode: 'create' })} className="self-start sm:self-auto">
          Add service
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <label htmlFor="service-search" className="sr-only">
              Search services
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              id="service-search"
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
          <div>
            <label htmlFor="service-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="service-status-filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as RecordStatus | '');
                setPage(0);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-sm text-[var(--text)] shadow-xs focus:border-[var(--btn-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--tag-bg)] sm:w-44 cursor-pointer"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          {isFetching && !isLoading && (
            <span className="text-xs text-[var(--text-secondary)]" aria-live="polite">
              Updating…
            </span>
          )}
        </div>

        <DataTable
          caption="Services"
          columns={columns}
          rows={data?.content}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyMessage={
            debouncedSearch || status
              ? 'No services match your search. Try a different name or status.'
              : 'No services yet. Add the first one so accounts can be linked to it.'
          }
          sort={sort}
          onSortChange={setSort}
          meta={data ? toPageMeta(data) : undefined}
          onPageChange={(displayPage) => setPage(displayPage - 1)}
        />
      </section>

      {form.mode !== 'closed' && (
        <ServiceFormModal
          key={form.mode === 'edit' ? form.service.id : 'new'}
          service={form.mode === 'edit' ? form.service : null}
          onClose={() => setForm({ mode: 'closed' })}
          onSaved={(saved, mode) => {
            setForm({ mode: 'closed' });
            setNotice(mode === 'created' ? `${saved.name} was added.` : `${saved.name} was updated.`);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!statusTarget}
        title={deactivating ? 'Deactivate service?' : 'Activate service?'}
        message={
          deactivating
            ? `${statusTarget?.name} will be marked inactive. Accounts that already use it keep it.`
            : `${statusTarget?.name} will be active again.`
        }
        confirmLabel={deactivating ? 'Deactivate' : 'Activate'}
        isDestructive={deactivating}
        isLoading={setServiceStatus.isPending}
        onConfirm={confirmStatusChange}
        onClose={closeStatusDialog}
      />
    </div>
  );
};
