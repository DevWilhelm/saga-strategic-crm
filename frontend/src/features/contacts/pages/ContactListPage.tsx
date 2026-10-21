import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Download, Upload, MoreHorizontal, Loader2, FileSpreadsheet } from 'lucide-react';
import { useContacts, useToggleContactClosed } from '../hooks/useContacts';
import type {
  ContactFilterParams,
  ContactTier,
  RelationshipStatus,
  ContactStatus,
  ClosedStateFilter,
  FollowUpScheduleFilter,
} from '../../../types/contact';
import { ContactFiltersBar } from '../components/ContactFiltersBar';
import { ContactTable } from '../components/ContactTable';
import { ContactExportMenu } from '../components/ContactExportMenu';
import { ContactImportDialog } from '../components/ContactImportDialog';
import { LoadingSkeleton, EmptyState, ErrorState } from '../../../components/common/WidgetState';
import { Can } from '../../../auth/Can';
import { usePermissions } from '../../../lib/permissions';
import { useAuth } from '../../../context/AuthContext';
import { downloadContactTemplate } from '../../import-export/utils/templateBuilder';
import { buildContactsCsv, buildContactsXlsx } from '../../import-export/utils/exportHelper';
import { downloadArrayBuffer, downloadBlob } from '../../import-export/utils/downloadHelper';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../../../api/accountsApi';
import { usersApi } from '../../../api/usersApi';

export const ContactListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { can, isMember } = usePermissions();
  const canTemplate = can('contact.template');
  const canImport = can('contact.import');
  const canExport = can('contact.export');
  const hasSecondaryActions = canTemplate || canImport || canExport;

  // Auto-dismiss action feedback toast
  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  // Close mobile dropdown menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Accounts & Users lookups for template download options
  const { data: accountsData } = useQuery({
    queryKey: ['accounts', 'lookup-options'],
    queryFn: () => accountsApi.getAccounts({ size: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'options'],
    queryFn: () => usersApi.getUserOptions(),
    staleTime: 5 * 60 * 1000,
  });

  // Handle template download with live company & user context
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadContactTemplate({
        companies: accountsData?.content?.map((a) => ({ name: a.name })),
        owners: usersData?.map((u) => ({
          username: (u as unknown as { username?: string }).username || u.name,
          name: u.name,
        })),
        currentUsername: user?.username,
        isMember,
      });
      setActionFeedback('Contact import template downloaded successfully.');
    } catch (err) {
      console.error('Failed to download contact import template:', err);
      setActionFeedback('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
      setIsMobileMenuOpen(false);
    }
  };

  // Parse filters from URL query string
  const filters: ContactFilterParams = useMemo(() => {
    const rawClosed = searchParams.get('closed') || searchParams.get('isClosed');
    let closed: ClosedStateFilter = 'ALL';
    if (rawClosed === 'OPEN' || rawClosed === 'CLOSED' || rawClosed === 'ALL') {
      closed = rawClosed;
    }

    const rawFollowUp = searchParams.get('followUp') || searchParams.get('followUpSchedule');
    let followUp: FollowUpScheduleFilter | undefined = undefined;
    if (
      rawFollowUp === 'OVERDUE' ||
      rawFollowUp === 'DUE_THIS_WEEK' ||
      rawFollowUp === 'NONE_SCHEDULED' ||
      rawFollowUp === 'ALL'
    ) {
      followUp = rawFollowUp as FollowUpScheduleFilter;
    }

    return {
      q: searchParams.get('q') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      tier: (searchParams.get('tier') as ContactTier) || undefined,
      relationshipStatus: (searchParams.get('relationshipStatus') as RelationshipStatus) || undefined,
      status: (searchParams.get('status') as ContactStatus) || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      closed,
      followUp,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 0,
      size: searchParams.get('size') ? parseInt(searchParams.get('size')!, 10) : 10,
      sort: searchParams.get('sort') || 'updatedDate,desc',
    };
  }, [searchParams]);

  // Sync state back to URL query string
  const updateFilters = useCallback(
    (newParams: Partial<ContactFilterParams>) => {
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
  const { data: contactsResponse, isLoading, isError, error, refetch } = useContacts(filters);
  const toggleClosedMutation = useToggleContactClosed();

  const handleToggleClosed = async (contactId: string, isClosed: boolean) => {
    try {
      await toggleClosedMutation.mutateAsync({ id: contactId, isClosed });
      setActionFeedback(isClosed ? 'Contact closed successfully.' : 'Contact reopened successfully.');
    } catch (err) {
      console.error('Failed to toggle contact closed status:', err);
      setActionFeedback('Failed to update contact status.');
    }
  };

  const contactsList = contactsResponse?.content || [];
  const totalElements = contactsResponse?.totalElements ?? 0;

  // Handle mobile export
  const handleMobileExport = async (format: 'xlsx' | 'csv') => {
    try {
      setIsExporting(true);
      setIsMobileMenuOpen(false);
      const today = new Date().toISOString().split('T')[0];
      if (format === 'xlsx') {
        const buffer = await buildContactsXlsx(contactsList);
        downloadArrayBuffer(
          buffer,
          `crm-contacts-export-${today}.xlsx`,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
      } else {
        const csv = await buildContactsCsv(contactsList);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `crm-contacts-export-${today}.csv`);
      }
      setActionFeedback(`Exported contacts as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(`Failed to export contacts as ${format}:`, err);
      setActionFeedback(`Failed to export contacts as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            Contacts
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            Manage key decision-makers, senior leadership, and stakeholder relationships.
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Secondary Actions (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center gap-2">
            {canTemplate && (
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                title="Download Excel Import Template"
              >
                {isDownloadingTemplate ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <Download className="w-4 h-4 text-slate-500" />
                )}
                <span>Template</span>
              </button>
            )}

            {canImport && (
              <button
                type="button"
                onClick={() => setIsImportDialogOpen(true)}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Import contacts from spreadsheet"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import</span>
              </button>
            )}

            {canExport && (
              <ContactExportMenu
                contacts={contactsList}
                totalCount={totalElements}
                disabled={isLoading || contactsList.length === 0}
              />
            )}
          </div>

          {/* Mobile Secondary Actions (Overflow Menu) */}
          {hasSecondaryActions && (
            <div className="relative sm:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                className="p-2 rounded-lg border shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="More contact actions"
              >
                <MoreHorizontal className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>

              {isMobileMenuOpen && (
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                  className="absolute right-0 mt-2 w-52 rounded-xl border shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                >
                  {canTemplate && (
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      disabled={isDownloadingTemplate}
                      style={{ color: 'var(--text)' }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {isDownloadingTemplate ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      ) : (
                        <Download className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Download Template</span>
                    </button>
                  )}

                  {canImport && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsImportDialogOpen(true);
                      }}
                      style={{ color: 'var(--text)' }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Import Contacts</span>
                    </button>
                  )}

                  {canExport && (
                    <>
                      <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
                      <div className="px-3.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Export Contacts
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMobileExport('xlsx')}
                        disabled={isExporting || contactsList.length === 0}
                        style={{ color: 'var(--text)' }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>Excel (.xlsx)</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMobileExport('csv')}
                        disabled={isExporting || contactsList.length === 0}
                        style={{ color: 'var(--text)' }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-slate-500" />
                          <span>CSV (.csv)</span>
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary "+ New Contact" Button */}
          <Can action="contact.create">
            <Link
              to="/contacts/new"
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shadow-2xs hover:opacity-95 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Link>
          </Can>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ContactFiltersBar
        filters={filters}
        onChange={(newFilters) => updateFilters(newFilters)}
        onReset={resetFilters}
      />

      {/* Main Table / State Section */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="rounded-xl border p-4 shadow-2xs"
        >
          <LoadingSkeleton rows={7} />
        </div>
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Failed to retrieve contacts from server.'}
          onRetry={() => refetch()}
        />
      ) : contactsList.length > 0 ? (
        <ContactTable
          contacts={contactsList}
          totalElements={totalElements}
          page={filters.page ?? 0}
          size={filters.size ?? 10}
          sort={filters.sort}
          onPageChange={(newPage) => updateFilters({ page: newPage })}
          onSizeChange={(newSize) => updateFilters({ size: newSize, page: 0 })}
          onSortChange={(newSort) => updateFilters({ sort: newSort, page: 0 })}
          onToggleClosed={handleToggleClosed}
          isTogglingClosed={toggleClosedMutation.isPending}
        />
      ) : (
        <EmptyState
          title="No contacts match your criteria"
          description="Try broadening your search term or clearing active filters to view all contacts."
          actionLabel="Clear All Filters"
          onAction={resetFilters}
        />
      )}

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 text-sm font-medium"
        >
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Contact Import Wizard Dialog */}
      <ContactImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
      />
    </div>
  );
};
