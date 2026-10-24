import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Download, Upload, MoreHorizontal, Loader2, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { useAccounts, useAccountLookups } from '../hooks/useAccounts';
import type { AccountFilters } from '../../../types/account';
import { AccountFiltersBar } from '../components/AccountFiltersBar';
import { AccountTable } from '../components/AccountTable';
import { LoadingSkeleton, EmptyState, ErrorState } from '../../../components/common/WidgetState';
import { Can } from '../../../auth/Can';
import { usePermissions } from '../../../auth/permissions';
import { useAuth } from '../../../context/AuthContext';
import { downloadAccountTemplate } from '../../import-export/utils/templateBuilder';
import { downloadBlob } from '../../import-export/utils/downloadHelper';
import { accountsApi } from '../../../api/accountsApi';
import { AccountImportDialog } from '../components/AccountImportDialog';

export const AccountListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { can } = usePermissions();
  const canTemplate = can('account.template');
  const canImport = can('account.import');
  const canExport = can('account.export');
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

  // Close desktop export split menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isExportMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportMenuOpen]);

  // Handle template download with live lookups and user context
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadAccountTemplate(lookups, user?.username);
    } catch (err) {
      console.error('Failed to download account import template:', err);
      setActionFeedback('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
      setIsMobileMenuOpen(false);
    }
  };

  // Parse filters from URL query string
  const filters: AccountFilters = useMemo(() => {
    const categoryId = searchParams.get('categoryId') || undefined;
    // Sub-category can only be filtered when its parent Category is selected
    const subCategoryId = categoryId ? searchParams.get('subCategoryId') || undefined : undefined;

    return {
      q: searchParams.get('q') || undefined,
      businessLine: searchParams.get('businessLine') || undefined,
      categoryId,
      subCategoryId,
      serviceId: searchParams.get('serviceId') || undefined,
      tier: searchParams.get('tier') || undefined,
      dealSide: searchParams.get('dealSide') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      country: searchParams.get('country') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 0,
      size: searchParams.get('size') ? parseInt(searchParams.get('size')!, 10) : 10,
      sort: searchParams.get('sort') || 'updatedDate,desc',
    };
  }, [searchParams]);

  // Sync state back to URL query string
  const updateFilters = useCallback(
    (newParams: Partial<AccountFilters>) => {
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

          // If categoryId was cleared or not present, ensure subCategoryId is also removed
          if (!updated.get('categoryId')) {
            updated.delete('subCategoryId');
          }

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
  const { data: accountsResponse, isLoading, isError, error, refetch } = useAccounts(filters);
  const { data: lookups } = useAccountLookups();

  const totalElements = accountsResponse?.totalElements ?? 0;

  // Build existing account names set for client-side pre-validation
  const existingAccountNames = useMemo(() => {
    const set = new Set<string>();
    if (accountsResponse?.content) {
      accountsResponse.content.forEach((a) => set.add(a.name.toLowerCase().trim()));
    }
    return set;
  }, [accountsResponse]);

  // Handle export (Excel / CSV)
  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      setIsExporting(true);
      setIsExportMenuOpen(false);
      setIsMobileMenuOpen(false);

      const { blob, filename } = await accountsApi.exportAccounts(filters, format);
      downloadBlob(blob, filename);
      setActionFeedback(`Exported accounts as ${format.toUpperCase()}`);
    } catch (err: unknown) {
      console.error(`Failed to export accounts as ${format}:`, err);
      const msg = err instanceof Error ? err.message : 'Failed to export accounts. Please try again.';
      setActionFeedback(msg);
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
            Accounts
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            Manage target corporate profiles, strategic accounts, and client relationships.
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Import accounts from spreadsheet"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import</span>
              </button>
            )}

            {canExport && (
              <div className="relative inline-flex rounded-lg shadow-xs" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => handleExport('xlsx')}
                  disabled={isExporting}
                  title={totalElements > 0 ? `Export ${totalElements.toLocaleString()} accounts` : 'Export accounts'}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-l-lg border text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  disabled={isExporting}
                  aria-expanded={isExportMenuOpen}
                  aria-label="Select export format"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  className="inline-flex items-center px-2 py-2 rounded-r-lg border border-l-0 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {isExportMenuOpen && (
                  <div
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                    className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border shadow-lg py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Export Format
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport('xlsx')}
                      disabled={isExporting}
                      style={{ color: 'var(--text)' }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Excel (.xlsx)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Default</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                      style={{ color: 'var(--text)' }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>CSV (.csv)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">UTF-8</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Collapsed Menu (375px) */}
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-xs"
                aria-expanded={isMobileMenuOpen}
                aria-label="More account actions"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                <span>More</span>
              </button>

              {isMobileMenuOpen && (
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                  className="absolute left-0 sm:right-0 mt-1.5 w-56 rounded-xl border shadow-lg py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                >
                  {canTemplate && (
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      disabled={isDownloadingTemplate}
                      style={{ color: 'var(--text)' }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                      <span>Import Accounts</span>
                    </button>
                  )}

                  {canExport && (
                    <>
                      <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
                      <div className="px-3.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Export Accounts
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExport('xlsx')}
                        disabled={isExporting}
                        style={{ color: 'var(--text)' }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>Excel (.xlsx)</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                        style={{ color: 'var(--text)' }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

          {/* Primary "+ New" Button (Fixed: single + icon and label) */}
          <Can action="account.create">
            <Link
              to="/accounts/new"
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Link>
          </Can>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <AccountFiltersBar
        filters={filters}
        lookups={lookups}
        onFilterChange={updateFilters}
        onResetFilters={resetFilters}
      />

      {/* Main Table / State Section */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="rounded-xl border p-4 shadow-xs"
        >
          <LoadingSkeleton rows={7} />
        </div>
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Failed to retrieve accounts from server.'}
          onRetry={() => refetch()}
        />
      ) : accountsResponse && accountsResponse.content.length > 0 ? (
        <AccountTable
          accounts={accountsResponse.content}
          totalElements={accountsResponse.totalElements}
          page={accountsResponse.page}
          size={accountsResponse.size}
          sort={filters.sort}
          onPageChange={(newPage) => updateFilters({ page: newPage })}
          onSizeChange={(newSize) => updateFilters({ size: newSize, page: 0 })}
          onSortChange={(newSort) => updateFilters({ sort: newSort, page: 0 })}
        />
      ) : (
        <EmptyState
          title="No accounts match your criteria"
          description="Try broadening your search term or clearing active filters to view all 134 accounts."
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

      {/* Account Import Wizard Dialog */}
      <AccountImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        lookups={lookups}
        currentUser={user}
        existingAccountNames={existingAccountNames}
      />
    </div>
  );
};
