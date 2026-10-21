import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { contactsApi, type ContactImportResponse } from '../../../api/contactsApi';
import { accountsApi } from '../../../api/accountsApi';
import { usersApi } from '../../../api/usersApi';
import {
  parseSpreadsheetFile,
  MAX_FILE_SIZE_BYTES,
  MAX_IMPORT_ROWS,
} from '../../import-export/utils/fileReader';
import {
  validateContactImportRows,
  downloadContactErrorReport,
  type ClientContactValidationResult,
} from '../../import-export/utils/rowValidator';
import { downloadContactTemplate } from '../../import-export/utils/templateBuilder';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

interface ContactImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'FILE' | 'REVIEW' | 'RESULT';
type FilterTab = 'ALL' | 'ERRORS' | 'DUPLICATES';

export const ContactImportDialog: React.FC<ContactImportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

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
  const [validationResult, setValidationResult] = useState<ClientContactValidationResult | null>(null);

  // Submit & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResponse, setImportResponse] = useState<ContactImportResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingErrorReport, setIsDownloadingErrorReport] = useState(false);

  // Confirmation dialog state
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch accounts & users for relational lookups
  const { data: accountsData } = useQuery({
    queryKey: ['accounts', 'import-lookups'],
    queryFn: () => accountsApi.getAccounts({ size: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'import-options'],
    queryFn: () => usersApi.getUserOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'import-existing'],
    queryFn: () => contactsApi.getContacts({ size: 100 }),
    staleTime: 2 * 60 * 1000,
  });

  const accounts = useMemo(() => accountsData?.content || [], [accountsData]);
  const users = useMemo(() => usersData || [], [usersData]);
  const existingContacts = useMemo(() => contactsData?.content || [], [contactsData]);

  const resetState = React.useCallback(() => {
    setStep('FILE');
    setSelectedFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawHeaders([]);
    setFileError(null);
    setDuplicatePolicy('SKIP');
    setActiveTab('ALL');
    setValidationResult(null);
    setIsSubmitting(false);
    setImportResponse(null);
    setSubmitError(null);
    setShowConfirmCancel(false);
  }, []);

  const handleClose = React.useCallback(() => {
    if (selectedFile && step !== 'RESULT') {
      setShowConfirmCancel(true);
    } else {
      resetState();
      onClose();
    }
  }, [selectedFile, step, resetState, onClose]);

  const handleFileChosen = async (file: File) => {
    setFileError(null);
    setSelectedFile(file);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File size exceeds the 5 MB limit. Please upload a smaller file.');
      return;
    }

    try {
      setIsParsing(true);
      const result = await parseSpreadsheetFile(file, 'Contacts');
      setSheetNames(result.sheetNames);
      setSelectedSheet(result.sheetName);
      setRawHeaders(result.headers);

      if (result.totalDataRows === 0) {
        setFileError('The selected spreadsheet does not contain any data rows.');
        return;
      }
      if (result.totalDataRows > MAX_IMPORT_ROWS) {
        setFileError(
          `This file contains ${result.totalDataRows} rows, which exceeds the limit of ${MAX_IMPORT_ROWS} contacts per batch.`
        );
        return;
      }

      // Run validation
      const validation = await validateContactImportRows(
        result.headers,
        result.rawRows,
        accounts,
        users,
        currentUser,
        existingContacts
      );
      setValidationResult(validation);
      setStep('REVIEW');
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'Failed to parse file. Ensure it is a valid spreadsheet.';
      setFileError(errMessage);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!validationResult) return;

    // Filter rows according to duplicate policy
    const rowsToSubmit = validationResult.rows
      .filter((r) => {
        if (r.status === 'ERROR') return false;
        if (r.status === 'DUPLICATE' && duplicatePolicy === 'SKIP') return false;
        return true;
      })
      .map((r) => r.data);

    if (rowsToSubmit.length === 0) {
      setSubmitError('There are no valid contacts to import based on your current settings.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await contactsApi.importContacts({
        mode: 'COMMIT',
        contacts: rowsToSubmit,
        duplicatePolicy,
      });

      setImportResponse(response);
      setStep('RESULT');

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadContactTemplate({
        companies: accounts.map((a) => ({ name: a.name })),
        owners: users.map((u) => ({
          username: (u as unknown as { username?: string }).username || u.name,
          name: u.name,
        })),
        currentUsername: currentUser?.username,
        isMember: currentUser?.role === 'MEMBER',
      });
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (!validationResult) return;
    try {
      setIsDownloadingErrorReport(true);
      await downloadContactErrorReport(rawHeaders, validationResult.rows);
    } finally {
      setIsDownloadingErrorReport(false);
    }
  };

  const filteredReviewRows = useMemo(() => {
    if (!validationResult) return [];
    if (activeTab === 'ERRORS') {
      return validationResult.rows.filter((r) => r.status === 'ERROR');
    }
    if (activeTab === 'DUPLICATES') {
      return validationResult.rows.filter((r) => r.status === 'DUPLICATE');
    }
    return validationResult.rows;
  }, [validationResult, activeTab]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-import-title"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          className="w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-scaleIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: 'var(--tag-bg)',
                  color: 'var(--tag-text)',
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 id="contact-import-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Import Contacts Wizard
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className={step === 'FILE' ? 'font-bold text-[var(--link)]' : ''}>1. Upload File</span>
                  <span>→</span>
                  <span className={step === 'REVIEW' ? 'font-bold text-[var(--link)]' : ''}>2. Review & Validate</span>
                  <span>→</span>
                  <span className={step === 'RESULT' ? 'font-bold text-[var(--link)]' : ''}>3. Commit Result</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* STEP 1: FILE UPLOAD */}
            {step === 'FILE' && (
              <div className="space-y-6">
                {/* Drag and Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-[var(--btn-primary)] transition flex flex-col items-center justify-center gap-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xlsm,.xlsb,.xls,.ods,.csv,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChosen(e.target.files[0]);
                      }
                    }}
                  />
                  <div
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      color: 'var(--btn-primary)',
                    }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs"
                  >
                    {isParsing ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isParsing ? 'Inspecting spreadsheet data...' : 'Click or drag your spreadsheet file here'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports Excel (.xlsx, .xls) and CSV (.csv) up to 5 MB (max 500 contacts)
                    </p>
                    {selectedSheet && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Detected sheet: <strong>{selectedSheet}</strong> ({sheetNames.length} sheet{sheetNames.length > 1 ? 's' : ''})
                      </p>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {fileError && (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 flex items-start gap-3 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">File Parsing Notice</p>
                      <p className="mt-0.5">{fileError}</p>
                    </div>
                  </div>
                )}

                {/* Template Download Prompt */}
                <div
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    borderColor: 'var(--border)',
                  }}
                  className="p-4 rounded-xl border flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-[var(--link)] shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      Need the standard columns and allowed lookups format?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloadingTemplate}
                    style={{ color: 'var(--link)' }}
                    className="font-bold inline-flex items-center gap-1.5 hover:underline shrink-0 cursor-pointer"
                  >
                    {isDownloadingTemplate ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download Official Template</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: REVIEW & VALIDATE */}
            {step === 'REVIEW' && validationResult && (
              <div className="space-y-5">
                {/* Submit Error Banner if any */}
                {submitError && (
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
                {/* Missing required headers notice */}
                {validationResult.missingRequiredHeaders.length > 0 ? (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Missing Mandatory Headers</span>
                    </div>
                    <p>
                      Your spreadsheet is missing required columns:{' '}
                      <strong>{validationResult.missingRequiredHeaders.join(', ')}</strong>. Import cannot proceed without them.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download the official template with correct headers
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Summary KPI Badges */}
                    <div className="grid grid-cols-4 gap-3 text-center text-xs">
                      <div
                        style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                        className="p-3 rounded-xl border"
                      >
                        <span className="text-slate-500 block">Total Rows</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {validationResult.counts.total}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200">
                        <span className="block opacity-80">Ready to Import</span>
                        <span className="text-lg font-bold">{validationResult.counts.valid}</span>
                      </div>
                      <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
                        <span className="block opacity-80">Duplicates</span>
                        <span className="text-lg font-bold">{validationResult.counts.duplicates}</span>
                      </div>
                      <div className="p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200">
                        <span className="block opacity-80">Errors</span>
                        <span className="text-lg font-bold">{validationResult.counts.errors}</span>
                      </div>
                    </div>

                    {/* Duplicate handling policy toggle */}
                    <div
                      style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                      className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Duplicate handling policy (same email or company+name):
                      </span>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="contactDuplicatePolicy"
                            checked={duplicatePolicy === 'SKIP'}
                            onChange={() => setDuplicatePolicy('SKIP')}
                            className="text-[var(--btn-primary)] focus:ring-[var(--btn-primary)]"
                          />
                          <span>Skip duplicates (default)</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="contactDuplicatePolicy"
                            checked={duplicatePolicy === 'ALLOW'}
                            onChange={() => setDuplicatePolicy('ALLOW')}
                            className="text-[var(--btn-primary)] focus:ring-[var(--btn-primary)]"
                          />
                          <span>Import anyway</span>
                        </label>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveTab('ALL')}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            activeTab === 'ALL'
                              ? 'bg-[var(--tag-bg)] text-[var(--tag-text)]'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          All ({validationResult.counts.total})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('ERRORS')}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            activeTab === 'ERRORS'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          Errors ({validationResult.counts.errors})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('DUPLICATES')}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            activeTab === 'DUPLICATES'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          Duplicates ({validationResult.counts.duplicates})
                        </button>
                      </div>

                      {(validationResult.counts.errors > 0 || validationResult.counts.duplicates > 0) && (
                        <button
                          type="button"
                          onClick={handleDownloadErrors}
                          disabled={isDownloadingErrorReport}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--link)] hover:underline cursor-pointer"
                        >
                          {isDownloadingErrorReport ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download Error Report (.xlsx)</span>
                        </button>
                      )}
                    </div>

                    {/* Preview Table */}
                    <div className="border rounded-xl overflow-x-auto max-h-64" style={{ borderColor: 'var(--border)' }}>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b" style={{ borderColor: 'var(--border)' }}>
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">Row</th>
                            <th className="py-2.5 px-3 w-20 text-center">Status</th>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Company</th>
                            <th className="py-2.5 px-3">Target Role</th>
                            <th className="py-2.5 px-3 text-center">Tier</th>
                            <th className="py-2.5 px-3">Email</th>
                            <th className="py-2.5 px-3">Validation Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                          {filteredReviewRows.slice(0, 100).map((r) => (
                            <tr key={r.rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-center text-slate-400">{r.rowNumber}</td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {r.status === 'VALID' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Valid
                                  </span>
                                ) : r.status === 'DUPLICATE' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    Duplicate
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                    Error
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-semibold">{r.data.name || '—'}</td>
                              <td className="py-2 px-3">{r.data.companyName || '—'}</td>
                              <td className="py-2 px-3 text-slate-500">{r.data.targetRole || '—'}</td>
                              <td className="py-2 px-3 text-center">{r.data.tier || '—'}</td>
                              <td className="py-2 px-3 text-slate-500">{r.data.email || '—'}</td>
                              <td className="py-2 px-3 text-xs text-red-600 dark:text-red-400">
                                {r.errors.length > 0
                                  ? r.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
                                  : r.duplicateReason || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 3: RESULT */}
            {step === 'RESULT' && importResponse && (
              <div className="text-center py-6 space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Import Processing Completed
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your spreadsheet was committed using the partial import pipeline.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200">
                    <span className="text-2xl font-bold block">{importResponse.createdCount}</span>
                    <span className="text-xs font-semibold">Contacts Created</span>
                  </div>
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
                    <span className="text-2xl font-bold block">{importResponse.skippedCount}</span>
                    <span className="text-xs font-semibold">Skipped</span>
                  </div>
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200">
                    <span className="text-2xl font-bold block">{importResponse.failedCount}</span>
                    <span className="text-xs font-semibold">Failed</span>
                  </div>
                </div>

                {/* Error Report Download if any failed or skipped */}
                {(importResponse.failedCount > 0 || importResponse.skippedCount > 0) && (
                  <button
                    type="button"
                    onClick={handleDownloadErrors}
                    disabled={isDownloadingErrorReport}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Annotated Error Report (.xlsx)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div>
              {step === 'REVIEW' && (
                <button
                  type="button"
                  onClick={() => setStep('FILE')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                {step === 'RESULT' ? 'Close' : 'Cancel'}
              </button>

              {step === 'REVIEW' && (
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={
                    isSubmitting ||
                    !validationResult ||
                    validationResult.missingRequiredHeaders.length > 0 ||
                    (validationResult.counts.valid === 0 &&
                      (duplicatePolicy === 'SKIP' || validationResult.counts.duplicates === 0))
                  }
                  style={{
                    backgroundColor: 'var(--btn-primary)',
                    color: 'var(--btn-primary-text)',
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg shadow hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing Contacts...</span>
                    </>
                  ) : (
                    <>
                      <span>Commit Import</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discard Progress Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmCancel}
        title="Discard Import Progress?"
        message="You have a spreadsheet loaded for validation. Closing the wizard will cancel the import process."
        confirmLabel="Discard & Close"
        isDestructive
        onConfirm={() => {
          setShowConfirmCancel(false);
          resetState();
          onClose();
        }}
        onClose={() => setShowConfirmCancel(false)}
      />
    </>
  );
};
