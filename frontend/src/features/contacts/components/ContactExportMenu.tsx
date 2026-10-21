import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { ContactListItem } from '../../../types/contact';
import { buildContactsCsv, buildContactsXlsx } from '../../import-export/utils/exportHelper';
import { downloadBlob, downloadArrayBuffer } from '../../import-export/utils/downloadHelper';

interface ContactExportMenuProps {
  contacts: ContactListItem[];
  totalCount: number;
  disabled?: boolean;
}

export const ContactExportMenu: React.FC<ContactExportMenuProps> = ({
  contacts,
  totalCount,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleExportXlsx = async () => {
    try {
      setIsExporting(true);
      setIsOpen(false);
      const buffer = await buildContactsXlsx(contacts);
      const today = new Date().toISOString().split('T')[0];
      downloadArrayBuffer(
        buffer,
        `crm-contacts-export-${today}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      setIsOpen(false);
      const csvStr = await buildContactsCsv(contacts);
      const today = new Date().toISOString().split('T')[0];
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `crm-contacts-export-${today}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-flex rounded-lg shadow-xs" ref={menuRef}>
      {/* Primary Excel Button */}
      <button
        type="button"
        disabled={disabled || isExporting}
        onClick={handleExportXlsx}
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-l-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
        title={`Export ${totalCount} matching contacts as Excel`}
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>Export</span>
      </button>

      {/* Split Chevron Dropdown */}
      <button
        type="button"
        disabled={disabled || isExporting}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
        }}
        className="inline-flex items-center px-2 text-xs rounded-r-lg border-t border-b border-r hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
        aria-label="Export options"
        aria-expanded={isOpen}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border shadow-lg py-1 z-30 animate-fadeIn text-xs"
        >
          <button
            type="button"
            onClick={handleExportXlsx}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer font-medium"
            style={{ color: 'var(--text)' }}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="block font-semibold">Excel Workbook (.xlsx)</span>
              <span className="text-[10px] text-slate-400">Formatted with headers</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer font-medium"
            style={{ color: 'var(--text)' }}
          >
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="block font-semibold">CSV Spreadsheet (.csv)</span>
              <span className="text-[10px] text-slate-400">UTF-8 with BOM</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
