import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { AccountLookups } from '../../../types/lookup';
import type { CurrentUser } from '../../../types/user';
import type { AccountImportPayload, AccountImportResponse } from '../../../types/account';
import { accountsApi } from '../../../api/accountsApi';
import { accountKeys } from '../hooks/useAccounts';
import {
  parseSpreadsheetFile,
  MAX_FILE_SIZE_BYTES,
  MAX_IMPORT_ROWS,
} from '../../import-export/utils/fileReader';
import {
  validateImportRows,
  downloadErrorReport,
  type ClientValidationResult,
} from '../../import-export/utils/rowValidator';
import { downloadAccountTemplate } from '../../import-export/utils/templateBuilder';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

interface AccountImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lookups?: AccountLookups | null;
  currentUser?: CurrentUser | null;
  existingAccountNames: Set<string>;
}

type WizardStep = 'FILE' | 'REVIEW' | 'RESULT';
type FilterTab = 'ALL' | 'ERRORS' | 'DUPLICATES';

export const AccountImportDialog: React.FC<AccountImportDialogProps> = ({
  isOpen,
  onClose,
  lookups,
  currentUser,
  existingAccountNames,
}) => {
  const queryClient = useQueryClient();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Review step state
  const [duplicatePolicy, setDuplicatePolicy] = useState<'SKIP' | 'ALLOW'>('SKIP');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [validationResult, setValidationResult] = useState<ClientValidationResult | null>(null);

  // Submit & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResponse, setImportResponse] = useState<AccountImportResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingErrorReport, setIsDownloadingErrorReport] = useState(false);

  // Confirmation dialog state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset dialog state when closed
  const resetState = useCallback(() => {
    setStep('FILE');
    setSelectedFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawHeaders([]);
    setIsParsing(false);
    setFileError(null);
    setDuplicatePolicy('SKIP');
    setActiveTab('ALL');
    setValidationResult(null);
    setIsSubmitting(false);
    setImportResponse(null);
    setSubmitError(null);
    setShowDiscardConfirm(false);
  }, []);

  const handleRequestClose = useCallback(() => {
    if (step === 'REVIEW' && selectedFile && !isSubmitting) {
      setShowDiscardConfirm(true);
    } else {
      resetState();
      onClose();
    }
  }, [step, selectedFile, isSubmitting, resetState, onClose]);

  // Keyboard navigation: Escape key closes the dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, handleRequestClose]);

  // Process chosen file
  const handleProcessFile = async (file: File, targetSheet?: string) => {
    setFileError(null);
    setIsParsing(true);

    try {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('File exceeds the 5 MB size limit. Please choose a smaller file.');
      }

      const parsed = await parseSpreadsheetFile(file, targetSheet);

      if (parsed.totalDataRows === 0) {
        throw new Error('The selected sheet contains no data rows to import.');
      }

      if (parsed.totalDataRows > MAX_IMPORT_ROWS) {
        throw new Error(
          `Sheet contains ${parsed.totalDataRows} data rows. Maximum allowed is ${MAX_IMPORT_ROWS} rows.`
        );
      }

      setSelectedFile(file);
      setSheetNames(parsed.sheetNames);
      setSelectedSheet(parsed.sheetName);
      setRawHeaders(parsed.headers);

      // Perform client validation
      const validation = validateImportRows(
        parsed.headers,
        parsed.rawRows,
        lookups || undefined,
        currentUser,
        existingAccountNames
      );

      setValidationResult(validation);
      setStep('REVIEW');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse spreadsheet file.';
      setFileError(msg);
      setSelectedFile(null);
      setValidationResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isParsing || isSubmitting) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Re-run validation if duplicate policy or sheet changes
  const handleSheetChange = (newSheet: string) => {
    if (!selectedFile) return;
    handleProcessFile(selectedFile, newSheet);
  };

  // Re-evaluate rows when duplicatePolicy changes
  const computedRows = useMemo(() => {
    if (!validationResult) return [];
    return validationResult.rows;
  }, [validationResult]);

  // Filter rows for review table tabs
  const filteredRows = useMemo(() => {
    if (!computedRows) return [];
    if (activeTab === 'ERRORS') return computedRows.filter((r) => r.status === 'ERROR');
    if (activeTab === 'DUPLICATES') return computedRows.filter((r) => r.status === 'DUPLICATE');
    return computedRows;
  }, [computedRows, activeTab]);

  // Count accounts ready for import based on duplicate policy
  const readyToImportCount = useMemo(() => {
    if (!computedRows) return 0;
    return computedRows.filter((r) => {
      if (r.status === 'VALID') return true;
      if (r.status === 'DUPLICATE' && duplicatePolicy === 'ALLOW') return true;
      return false;
    }).length;
  }, [computedRows, duplicatePolicy]);

  // Handle template download directly from dialog
  const handleDownloadTemplateFromDialog = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadAccountTemplate(lookups, currentUser?.username);
    } catch (err) {
      console.error('Failed to download template:', err);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Handle download error report
  const handleDownloadErrorReport = async () => {
    if (!rawHeaders || !computedRows) return;
    try {
      setIsDownloadingErrorReport(true);
      await downloadErrorReport(rawHeaders, computedRows);
    } catch (err) {
      console.error('Failed to download error report:', err);
    } finally {
      setIsDownloadingErrorReport(false);
    }
  };

  // Submit import payload to server
  const handleCommitImport = async () => {
    if (!validationResult || readyToImportCount === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Prepare payload
    const rowsToSubmit = validationResult.rows
      .filter((r) => {
        if (r.status === 'VALID') return true;
        if (r.status === 'DUPLICATE' && duplicatePolicy === 'ALLOW') return true;
        return false;
      })
      .map((r) => r.data);

    const payload: AccountImportPayload = {
      mode: 'COMMIT',
      duplicatePolicy,
      rows: rowsToSubmit,
    };

    try {
      const response = await accountsApi.importAccounts(payload);
      setImportResponse(response);

      // Invalidate accounts lists and dashboard counts
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      setStep('RESULT');
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Failed to import accounts. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasMissingRequiredColumns =
    validationResult?.headerAnalysis.missingRequiredColumns &&
    validationResult.headerAnalysis.missingRequiredColumns.length > 0;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div
            style={{ borderColor: 'var(--border)' }}
            className="flex items-center justify-between px-5 sm:px-6 py-4 border-b shrink-0"
          >
            <div>
              <h2 id="import-dialog-title" className="text-lg font-bold tracking-tight">
                Import Accounts
              </h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
                Upload accounts in bulk from Excel or CSV spreadsheets
              </p>
            </div>

            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div
            style={{
              backgroundColor: 'var(--table-header-bg)',
              borderColor: 'var(--border)',
            }}
            className="flex items-center justify-between px-6 py-2.5 border-b text-xs font-medium shrink-0"
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: step === 'FILE' ? 'var(--btn-primary)' : 'var(--badge-blue-bg)',
                  color: step === 'FILE' ? 'var(--btn-primary-text)' : 'var(--badge-blue-text)',
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
              >
                1
              </span>
              <span style={{ color: step === 'FILE' ? 'var(--text)' : 'var(--text-secondary)' }}>
                Choose File
              </span>
            </div>

            <div className="h-px w-8 sm:w-16 bg-slate-300 dark:bg-slate-700" />

            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: step === 'REVIEW' ? 'var(--btn-primary)' : 'var(--badge-blue-bg)',
                  color: step === 'REVIEW' ? 'var(--btn-primary-text)' : 'var(--badge-blue-text)',
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
              >
                2
              </span>
              <span style={{ color: step === 'REVIEW' ? 'var(--text)' : 'var(--text-secondary)' }}>
                Review & Validate
              </span>
            </div>

            <div className="h-px w-8 sm:w-16 bg-slate-300 dark:bg-slate-700" />

            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: step === 'RESULT' ? 'var(--btn-primary)' : 'var(--badge-blue-bg)',
                  color: step === 'RESULT' ? 'var(--btn-primary-text)' : 'var(--badge-blue-text)',
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
              >
                3
              </span>
              <span style={{ color: step === 'RESULT' ? 'var(--text)' : 'var(--text-secondary)' }}>
                Result
              </span>
            </div>
          </div>

          {/* Dialog Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* ------------------------------------------------------------- */}
            {/* STEP 1: CHOOSE FILE                                          */}
            {/* ------------------------------------------------------------- */}
            {step === 'FILE' && (
              <div className="space-y-5">
                {fileError && (
                  <div
                    style={{
                      backgroundColor: 'var(--status-overdue-bg)',
                      borderColor: 'var(--status-overdue-border)',
                      color: 'var(--status-overdue-text)',
                    }}
                    className="flex items-start gap-2.5 p-3.5 rounded-xl border text-sm"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Unable to process file</p>
                      <p className="text-xs mt-0.5">{fileError}</p>
                    </div>
                  </div>
                )}

                {/* Dropzone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                  }}
                  className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors group text-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xlsm,.xlsb,.xls,.ods,.csv,.tsv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                  />

                  {isParsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                      <p className="text-sm font-medium">Analyzing spreadsheet structure...</p>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-xs">
                        Reading sheets, UTF-8 encoded text, and validating column headers
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 mb-3 group-hover:scale-105 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-base font-semibold">
                        Drag and drop your spreadsheet here, or{' '}
                        <span className="text-blue-600 underline">browse</span>
                      </p>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-1.5 max-w-md">
                        Supported file types: <span className="font-medium text-slate-700 dark:text-slate-300">.xlsx, .xlsm, .xlsb, .xls, .ods, .csv, .tsv</span>
                      </p>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
                        Maximum file size: 5 MB | Up to 500 accounts per upload
                      </p>
                    </>
                  )}
                </div>

                {/* Template Download Prompt */}
                <div
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    borderColor: 'var(--border)',
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border"
                >
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Need the official import template?</p>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-xs">
                        Download the pre-formatted Excel template with instructions and live lookup lists.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadTemplateFromDialog}
                    disabled={isDownloadingTemplate}
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    {isDownloadingTemplate ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <Download className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: REVIEW & VALIDATE                                    */}
            {/* ------------------------------------------------------------- */}
            {step === 'REVIEW' && validationResult && (
              <div className="space-y-4">
                {/* Multi-sheet picker if workbook has >1 sheets */}
                {sheetNames.length > 1 && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Workbook has {sheetNames.length} sheets:
                    </span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border outline-none font-medium"
                    >
                      {sheetNames.map((name) => (
                        <option key={name} value={name}>
                          Sheet: {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Missing required headers blocker banner */}
                {hasMissingRequiredColumns ? (
                  <div
                    style={{
                      backgroundColor: 'var(--status-overdue-bg)',
                      borderColor: 'var(--status-overdue-border)',
                      color: 'var(--status-overdue-text)',
                    }}
                    className="p-4 rounded-xl border space-y-2 text-sm"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>Missing required columns in spreadsheet</span>
                    </div>
                    <p className="text-xs">
                      The uploaded file is missing the following mandatory headers:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {validationResult.headerAnalysis.missingRequiredColumns.map((col) => (
                        <span
                          key={col.key}
                          className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/50 font-mono text-xs font-semibold"
                        >
                          {col.header}
                        </span>
                      ))}
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleDownloadTemplateFromDialog}
                        disabled={isDownloadingTemplate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Standard Template</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Unknown columns warning notice */}
                {validationResult.headerAnalysis.unknownHeaders.length > 0 && (
                  <div
                    style={{
                      backgroundColor: 'var(--badge-yellow-bg)',
                      borderColor: 'var(--badge-yellow-border)',
                      color: 'var(--badge-yellow-text)',
                    }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border text-xs"
                  >
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Notice:</span> Unknown columns ignored:
                      <span className="font-mono ml-1">
                        {validationResult.headerAnalysis.unknownHeaders.join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Summary Metrics & Duplicate Policy Bar */}
                <div
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    borderColor: 'var(--border)',
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border"
                >
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      {validationResult.counts.valid} valid
                    </span>
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {validationResult.counts.errors} errors
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      {validationResult.counts.duplicates} duplicates
                    </span>
                  </div>

                  {/* Duplicate Policy Radio Toggle */}
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                      If account already exists:
                    </span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="dupPolicy"
                        value="SKIP"
                        checked={duplicatePolicy === 'SKIP'}
                        onChange={() => setDuplicatePolicy('SKIP')}
                        className="text-blue-600 cursor-pointer"
                      />
                      <span>Skip it</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer ml-1">
                      <input
                        type="radio"
                        name="dupPolicy"
                        value="ALLOW"
                        checked={duplicatePolicy === 'ALLOW'}
                        onChange={() => setDuplicatePolicy('ALLOW')}
                        className="text-blue-600 cursor-pointer"
                      />
                      <span>Import anyway</span>
                    </label>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === 'ALL'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    All ({computedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ERRORS')}
                    className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === 'ERRORS'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Errors ({validationResult.counts.errors})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DUPLICATES')}
                    className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === 'DUPLICATES'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Duplicates ({validationResult.counts.duplicates})
                  </button>

                  {computedRows.length > 100 && (
                    <span style={{ color: 'var(--text-secondary)' }} className="text-[11px] ml-auto">
                      Showing first 100 of {computedRows.length} rows
                    </span>
                  )}
                </div>

                {/* Preview Table */}
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                  className="rounded-xl border overflow-x-auto max-h-72"
                >
                  <table className="w-full text-left text-xs">
                    <thead
                      style={{
                        backgroundColor: 'var(--table-header-bg)',
                        color: 'var(--text-secondary)',
                      }}
                      className="sticky top-0 z-10 border-b font-semibold uppercase text-[11px]"
                    >
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Account Name</th>
                        <th className="px-3 py-2">Business Line</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Service</th>
                        <th className="px-3 py-2">Tier</th>
                        <th className="px-3 py-2">Issues / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRows.slice(0, 100).map((row) => {
                        const isError = row.status === 'ERROR';
                        const isDup = row.status === 'DUPLICATE';

                        return (
                          <tr
                            key={row.rowNumber}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors ${
                              isError
                                ? 'bg-red-50/30 dark:bg-red-950/20'
                                : isDup
                                ? 'bg-amber-50/30 dark:bg-amber-950/20'
                                : ''
                            }`}
                          >
                            <td className="px-3 py-2 font-mono font-medium text-slate-500">
                              {row.rowNumber}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.status === 'VALID' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              )}
                              {row.status === 'DUPLICATE' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                  <AlertTriangle className="w-3 h-3" /> Duplicate
                                </span>
                              )}
                              {row.status === 'ERROR' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium max-w-[160px] truncate">
                              {row.data.name || <span className="text-slate-400 italic">Empty</span>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.data.businessLine}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.raw['Category*'] || row.raw.Category || '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.raw['Service*'] || row.raw.Service || '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.data.tier}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-red-600 dark:text-red-400 max-w-[220px]">
                              {row.errors.length > 0
                                ? row.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
                                : row.duplicateReason || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {submitError && (
                  <div
                    style={{
                      backgroundColor: 'var(--status-overdue-bg)',
                      borderColor: 'var(--status-overdue-border)',
                      color: 'var(--status-overdue-text)',
                    }}
                    className="p-3 rounded-xl border text-xs"
                  >
                    {submitError}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: RESULT SCREEN                                        */}
            {/* ------------------------------------------------------------- */}
            {step === 'RESULT' && importResponse && (
              <div className="space-y-6 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold">Import Processing Complete</h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
                    Your spreadsheet was successfully processed. Valid accounts are now saved in the system.
                  </p>
                </div>

                {/* Summary stat cards */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {importResponse.created}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Accounts Created
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {importResponse.skipped}
                    </p>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
                      Duplicates Skipped
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {importResponse.failed}
                    </p>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mt-0.5">
                      Rows Failed
                    </p>
                  </div>
                </div>

                {/* Error report button */}
                {(importResponse.failed > 0 || importResponse.skipped > 0) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      disabled={isDownloadingErrorReport}
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {isDownloadingErrorReport ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      ) : (
                        <Download className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Download Error Report (.xlsx)</span>
                    </button>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-1.5">
                      Contains original rows with row numbers, status, and specific error messages.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{ borderColor: 'var(--border)' }}
            className="flex items-center justify-between px-5 sm:px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/20 shrink-0"
          >
            {step === 'FILE' && (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={handleRequestClose}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {step === 'REVIEW' && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('FILE')}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestClose}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                    className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={readyToImportCount === 0 || hasMissingRequiredColumns || isSubmitting}
                    style={{
                      backgroundColor: 'var(--btn-primary)',
                      color: 'var(--btn-primary-text)',
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Importing accounts...</span>
                      </>
                    ) : (
                      <>
                        <span>Import {readyToImportCount} accounts</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {step === 'RESULT' && (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    resetState();
                    onClose();
                  }}
                  style={{
                    backgroundColor: 'var(--btn-primary)',
                    color: 'var(--btn-primary-text)',
                  }}
                  className="px-5 py-2 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styled Discard Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard import in progress?"
        message="You have reviewed accounts ready to import. Closing now will discard your parsed file and review progress."
        confirmLabel="Discard"
        cancelLabel="Continue Review"
        isDestructive={true}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          resetState();
          onClose();
        }}
        onClose={() => setShowDiscardConfirm(false)}
      />
    </>
  );
};
