import React, { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, Pencil, Plus, Search } from 'lucide-react';
import { DataTable, type Column } from '../../../components/common/DataTable';
import { Button } from '../../../components/common/Button';
import { FollowUpDateBadge } from '../../accounts/components/FollowUpDateBadge';
import { FollowUpFormModal } from '../components/FollowUpFormModal';
import { LogContactModal } from '../components/LogContactModal';
import { useFollowUpCounts, useFollowUps } from '../hooks/useFollowUps';
import { useAuth } from '../../../context/AuthContext';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { formatISODate } from '../../../utils/dates';
import { toPageMeta, type SortState } from '../../../types/common';
import type { FollowUpCounts, FollowUpRecord, FollowUpState } from '../../../types/followUp';

const PAGE_SIZE = 10;

type Tab = FollowUpState | 'all';

// Colors from the CRM color code: overdue red, due today amber, next 7 days blue.
const TABS: { id: Tab; label: string; activeClass: string; countClass: string }[] = [
  { id: 'all', label: 'All', activeClass: 'border-[var(--btn-primary)] bg-[var(--tag-bg)] text-[var(--tag-text)]', countClass: 'bg-[var(--table-header-bg)] text-[var(--text-secondary)]' },
  { id: 'overdue', label: 'Overdue', activeClass: 'border-[var(--status-overdue-text)] bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)]', countClass: 'bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)]' },
  { id: 'today', label: 'Today', activeClass: 'border-[var(--status-warning-text)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]', countClass: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]' },
  { id: 'week', label: 'This week', activeClass: 'border-[var(--status-info-text)] bg-[var(--status-info-bg)] text-[var(--status-info-text)]', countClass: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]' },
  { id: 'upcoming', label: 'Later', activeClass: 'border-[var(--btn-primary)] bg-[var(--tag-bg)] text-[var(--tag-text)]', countClass: 'bg-[var(--table-header-bg)] text-[var(--text-secondary)]' },
];

const EMPTY_MESSAGES: Record<Tab, string> = {
  all: 'No follow-ups yet. Add one to plan the next contact with someone.',
  overdue: 'Nothing overdue. Nice work.',
  today: 'Nothing due today.',
  week: 'Nothing due in the next 7 days.',
  upcoming: 'Nothing planned beyond the next 7 days.',
};

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; followUp: FollowUpRecord };

export const FollowUpListPage: React.FC = () => {
  const { user, role } = useAuth();
  const [tab, setTab] = useState<Tab>('all');
  const [scope, setScope] = useState<'me' | 'everyone'>('me');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ field: 'dueDate', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [logTarget, setLogTarget] = useState<FollowUpRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ownerId = scope === 'me' ? 'me' : undefined;
  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading, isError, error, refetch, isFetching } = useFollowUps({
    q: debouncedSearch,
    state: tab === 'all' ? undefined : tab,
    ownerId,
    page,
    size: PAGE_SIZE,
    sort,
  });
  const counts = useFollowUpCounts(ownerId);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Members work on their own follow-ups; Admins and Super Admins on anyone's.
  const canWorkOn = (f: FollowUpRecord) => role === 'SUPER_ADMIN' || role === 'ADMIN' || f.ownerId === user?.id;

  const columns: Column<FollowUpRecord>[] = [
    {
      key: 'dueDate',
      header: 'Due',
      sortField: 'dueDate',
      render: (f) => <FollowUpDateBadge dateStr={f.dueDate} />,
    },
    {
      key: 'contact',
      header: 'Contact',
      sortField: 'contactName',
      render: (f) => (
        <div className="min-w-0">
          <p className="font-semibold text-[var(--text)]">{f.contactName}</p>
          {f.companyName && <p className="text-xs text-[var(--text-secondary)]">{f.companyName}</p>}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Next action',
      className: 'max-w-sm',
      render: (f) => (
        <div className="min-w-0">
          <p className="text-[var(--text)]">{f.action}</p>
          {f.descriptionRemark && (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">{f.descriptionRemark}</p>
          )}
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      sortField: 'ownerName',
      render: (f) => <span className="whitespace-nowrap text-[var(--text)]">{f.ownerName}</span>,
    },
    {
      key: 'lastContacted',
      header: 'Last contacted',
      render: (f) => (
        <div className="whitespace-nowrap text-xs text-[var(--text-secondary)]">
          <p>{formatISODate(f.lastContactedDate)}</p>
          {f.period && <p className="mt-0.5">Every {f.period} days</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (f) =>
        canWorkOn(f) ? (
          <div className="flex justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setLogTarget(f)}
              aria-label={`Log contact for ${f.action}`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--btn-primary)] transition hover:bg-[var(--tag-bg)] cursor-pointer"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Log contact
            </button>
            <button
              type="button"
              onClick={() => setForm({ mode: 'edit', followUp: f })}
              aria-label={`Edit ${f.action}`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--link)] transition hover:bg-[var(--table-header-bg)] cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        ) : (
          <span className="text-xs text-[var(--text-secondary)]">View only</span>
        ),
    },
  ];

  const countFor = (id: Tab) => (counts.data ? counts.data[id as keyof FollowUpCounts] : undefined);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
            <Clock className="h-5 w-5 text-[var(--btn-primary)]" />
            Follow-ups
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
            Next contacts planned with each person, by due date. Log a contact to move it to the next date.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setForm({ mode: 'create' })} className="self-start sm:self-auto">
          Add follow-up
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

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
        {/* Due-date tabs */}
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Show follow-ups">
          {TABS.map((t) => {
            const active = tab === t.id;
            const count = countFor(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setTab(t.id);
                  setPage(0);
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  active ? t.activeClass : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--background)]'
                }`}
              >
                {t.label}
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums ${t.countClass}`}
                >
                  {count ?? '–'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <label htmlFor="follow-up-search" className="sr-only">
              Search follow-ups
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              id="follow-up-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search action, contact or company"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-3 pl-9 text-sm text-[var(--text)] shadow-xs placeholder:text-[var(--text-secondary)] placeholder:opacity-70 focus:border-[var(--btn-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--tag-bg)]"
            />
          </div>
          <div>
            <label htmlFor="follow-up-scope" className="sr-only">
              Whose follow-ups
            </label>
            <select
              id="follow-up-scope"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as 'me' | 'everyone');
                setPage(0);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pr-8 pl-3 text-sm text-[var(--text)] shadow-xs focus:border-[var(--btn-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--tag-bg)] sm:w-48 cursor-pointer"
            >
              <option value="me">My follow-ups</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>
          {isFetching && !isLoading && (
            <span className="text-xs text-[var(--text-secondary)]" aria-live="polite">
              Updating…
            </span>
          )}
        </div>

        <DataTable
          caption="Follow-ups"
          columns={columns}
          rows={data?.content}
          rowKey={(f) => f.id}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyMessage={
            debouncedSearch ? 'No follow-ups match your search. Try another word.' : EMPTY_MESSAGES[tab]
          }
          sort={sort}
          onSortChange={setSort}
          meta={data ? toPageMeta(data) : undefined}
          onPageChange={(displayPage) => setPage(displayPage - 1)}
        />
      </section>

      {form.mode !== 'closed' && (
        <FollowUpFormModal
          key={form.mode === 'edit' ? form.followUp.id : 'new'}
          followUp={form.mode === 'edit' ? form.followUp : null}
          onClose={() => setForm({ mode: 'closed' })}
          onSaved={(saved, mode) => {
            setForm({ mode: 'closed' });
            setNotice(
              mode === 'created'
                ? `Follow-up with ${saved.contactName} added, due ${formatISODate(saved.dueDate)}.`
                : `Follow-up with ${saved.contactName} updated.`
            );
          }}
        />
      )}

      {logTarget && (
        <LogContactModal
          key={logTarget.id}
          followUp={logTarget}
          onClose={() => setLogTarget(null)}
          onLogged={(saved) => {
            setLogTarget(null);
            setNotice(`Contact with ${saved.contactName} logged. Next due ${formatISODate(saved.dueDate)}.`);
          }}
        />
      )}
    </div>
  );
};
